"""
"""

import base64
import collections  # To patch a py3.10 issue
import functools
import json
import logging
import mimetypes
import os
import pathlib
import re
import sys
import time
import urllib.parse

from flask import Flask, request, Request, Response, render_template
from flask_cors import CORS
import requests

collections.Callable = collections.abc.Callable  # SOURCE: https://stackoverflow.com/a/70641487

import httplib2shim  # NOTE: fixes non-thread-safe httplib2 problems caused by Google's API library
httplib2shim.patch()

os.environ["MMROOT"] = "~/.mediaman/"
sys.path.append(os.environ["MEDIAMAN_REPO_PATH"])
from mediaman.core import api, logtools, policy  # noqa
logtools.set_level("DEBUG")
import subtitles  # noqa
import zipstream  # noqa

app = Flask(__name__)
CORS(app)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


with open("certificates.json") as infile:
    USERS = json.loads(infile.read())

ADMINS = {k for k, v in USERS.items() if v.get("is_admin", False)}

with open("priority.json") as infile:
    MM_SERVICE_PRIORITY_LIST = json.loads(infile.read())


def b64encode(v):
    return base64.b64encode(v.encode('utf-8')).decode('utf-8')


def b64decode(v):
    return base64.b64decode(v.encode('utf-8')).decode('utf-8')


app.add_template_filter(b64encode)


def preferred(s1, s2):
    # TODO(mcotton): MMCONFIG/mm should be handling this
    if s1 is None:
        return s2
    elif s2 is None:
        return s1

    services = {s1, s2}
    for service in MM_SERVICE_PRIORITY_LIST:
        if service in services:
            return service

    return s1 or s2


# Globals
MEDIA_HOST_URL = os.environ["MEDIA_HOST_URL"]
CAST_CONTROLLER_URL = os.environ.get("CAST_CONTROLLER_URL", None)

ITEMS = {}

CONSUMPTION = 2**20
READS = []

CLIENTS = {}
ZIPVIEWS = {}


def mmzipview(api, hash, size, service=None, cache=True):
    def wrapper(offset, length):
        return b''.join(
            api.run_stream_range(pathlib.Path(), hash, offset, length, service_selector=service)
        )

    stream = wrapper
    if cache:
        stream = functools.lru_cache(wrapper)

    return zipstream.zipstream(stream, size)


@app.route('/reload', methods=['GET'])
def reload_list():
    global ITEMS, READS, CLIENTS, ZIPVIEWS
    del ITEMS, READS, CLIENTS, ZIPVIEWS
    ITEMS = {}

    # force a refresh of all file lists by
    # querying the data sources
    policy.load_client(None).force_init()

    for r in api.run_list("all"):
        for f in r.response:
            hash = f['hashes'][0]
            f["service"] = preferred(r.client.nickname(), ITEMS.get(hash, {"service": None})["service"])
            if hash in ITEMS:
                f["tags"] = sorted(set(f["tags"]) | set(ITEMS[hash]["tags"]))
            ITEMS[hash] = f  # TODO: destructive, hides tags

    READS = []
    CLIENTS = {}
    ZIPVIEWS = {}

    logger.info("mmServer ready to serve.")
    return str(len(ITEMS))


def video(hash, offset, length, service=None):
    global CLIENTS

    root = pathlib.Path()

    # Non-persistent:
    # return api.run_stream_range(root, hash, offset, length, service_selector=service)

    # Persistent:
    if service not in CLIENTS:
        CLIENTS[service] = policy.load_client(service)
    client = CLIENTS[service]
    return client.stream_range(root, hash, offset, length)


def whole(hash, service=None):
    return api.run_stream(pathlib.Path(), hash, service_selector=service)


def next_read():
    global CONSUMPTION, READS
    MIN_READ = 2**20
    MAX_READ = 2**20 * 10
    read = MIN_READ
    if len(READS) > 1:
        total = sum(e[0] for e in READS)
        delta = READS[-1][1] - READS[0][1]
        avg = total / delta
        logger.info(f"total/delta/avg: " + repr((total, delta, avg)))
        read = min(round(max(read, avg) * 2), MAX_READ)
    READS = READS[-4:] + [(read, time.time())]
    return read


class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        request = Request(environ)

        environ["username"] = None
        environ["admin"] = False

        print(environ, request)

        # No intervening HTTP Basic Auth, user identity unknown
        # TODO: we could also check cert...
        if not request.authorization:
            return self.app(environ, start_response)

        # HTTP Basic Auth -- we have a username
        username = request.authorization["username"]
        cert_hash = request.environ["HTTP_X_SSL_CERT_FINGERPRINT"]
        target_cert_hash = USERS.get(username, {}).get("cert")

        # if not target_cert_hash:
        #     error = "This user's access has been revoked.  Contact your administrator."
        #     res = Response(error, mimetype= 'text/plain', status=401)
        #     return res(environ, start_response)

        if cert_hash != target_cert_hash:
            error = "Mismatch between provided certificate and preregistered certificate hash.  Contact your administrator."
            res = Response(error, mimetype= 'text/plain', status=401)
            return res(environ, start_response)

        environ["username"] = username
        if username in ADMINS:
            environ["admin"] = True

        return self.app(environ, start_response)

app.wsgi_app = AuthMiddleware(app.wsgi_app)


@app.route('/')
def index():
    result = get_api_list()
    username = result["username"]
    items = result["items"]

    return render_template("index.html", data={'user': username, 'test': 123, 'list': items, 'media_host': MEDIA_HOST_URL})  # TODO: FIXME


@app.route('/api/cast/<hash>')
def api_cast_start(hash):
    return cast_start(hash).text


def cast_start(hash):
    if not CAST_CONTROLLER_URL:
        return

    start_url = f"{CAST_CONTROLLER_URL}/start"
    media_url = f"{MEDIA_HOST_URL}/stream/{hash}"
    response = requests.post(start_url, json={"url": media_url})

    print(response.text)
    return response


@app.route('/api/list')
def api_list():
    return json.dumps(get_api_list())


def get_api_list():
    logger.info(repr(request.authorization))
    logger.info(repr(request.environ))
    global ITEMS

    username = None
    if request.authorization:
        # HTTP Basic Auth -- we have a username
        username = request.authorization["username"]
        cert_hash = request.environ["HTTP_X_SSL_CERT_FINGERPRINT"]
        target_cert_hash = USERS.get(username, {}).get("cert")
        if cert_hash != target_cert_hash:
            errors = ["Mismatch between provided cert and preregistered certificate hash.  Contact your administrator."]
            return {
                "username": None,
                "items": None,
                "errors": errors,
            }

        if username in ADMINS:
            items = list(ITEMS.values())
        else:
            view_tag = f"{username}.view"
            logger.info(view_tag)
            items = [item for item in ITEMS.values() if view_tag in item["tags"]]
            logger.info(repr([i for i in ITEMS.values() if i["tags"]]))
    else:
        # No intervening HTTP Basic Auth, user identity unknown
        # TODO: we could also check cert...
        items = list(ITEMS.values())

    return {
        "username": username,
        "items": items,
        "errors": [],
    }


@app.route('/view/<hash>')
def view(hash):
    context = get_api_detail(hash)
    return render_template("view.html", data=context)  # TODO: FIXME


@app.route('/detail/<hash>')
def detail(hash):
    context = get_api_detail(hash)
    return render_template("detail.html", data=context)  # TODO: FIXME


@app.route('/api/detail/<hash>')
def api_detail(hash):
    return json.dumps(get_api_detail(hash))


def get_api_detail(hash):
    global ITEMS
    mimetype = mimetypes.guess_type(ITEMS[hash]['name'])[0]
    return {
        'item': ITEMS[hash],
        'mimetype': mimetype,
        'media_host': MEDIA_HOST_URL,
    }


@app.route('/zipdetail/<hash>')
def zipdetail(hash):
    global ITEMS
    mimetype = mimetypes.guess_type(ITEMS[hash]['name'])[0]
    view = get_zip_view(hash)
    context = {
        'item': ITEMS[hash],
        'mimetype': mimetype,
        'media_host': MEDIA_HOST_URL,
        'zipview': view,
    }
    return render_template("zipview.html", data=context)


@app.route('/zipget/<hash>/<b64name>')
def zipget(hash, b64name):
    subname = b64decode(b64name)

    data = api_zipget(hash, subname)

    mimetype = get_mimetype_from_name(subname)

    resp = Response(data, 200, mimetype=mimetype, content_type=mimetype, direct_passthrough=True)
    return resp


def api_zipget(hash, subname):
    global ITEMS, ZIPVIEWS
    view = get_zip_view(hash)
    data = view.read(subname)
    return data


def get_zip_view(hash):
    global ITEMS, ZIPVIEWS
    if hash in ZIPVIEWS:
        view = ZIPVIEWS[hash]
    else:
        view = mmzipview(api, hash, ITEMS[hash]["size"], service=ITEMS[hash]["service"])
        ZIPVIEWS[hash] = view
    return view


@app.route('/streamtype/<hash>')
def streamtype(hash):
    return get_mimetype_from_hash(hash)


def get_mimetype_from_hash(hash):
    global ITEMS
    item = ITEMS[hash]
    name = item["name"]
    return get_mimetype_from_name(name)


def get_mimetype_from_name(name):
    mimetype = mimetypes.guess_type(name)[0]
    if mimetype == 'audio/mp4a-latm':
        mimetype = 'audio/mp4'
    elif mimetype == 'video/quicktime':
        mimetype = 'video/mp4'
    return mimetype


@app.route('/download/<hash>')
def download(hash):
    global ITEMS
    item = ITEMS[hash]
    name = item["name"]
    service = item["service"]

    stream = whole(hash, service=service)
    resp = Response(stream)
    resp.headers.add('Content-Type', "application/octet-stream")
    resp.headers.add('Content-Length', item["size"])
    resp.headers.add('Transfer-Encoding', "chunked")
    resp.headers.add('Content-Disposition',
        f'''attachment; filename="{urllib.parse.quote(name, encoding='utf-8')}"''')
    return resp


@app.route('/subtitles/<hash>')
def view_subtitles(hash):
    global ITEMS
    item = ITEMS[hash]
    tags = item["tags"]

    print(tags)

    try:
        subtitles_tag = [t for t in tags if t.startswith("subtitles:")][0]
    except IndexError:
        return (b"", 404)

    if subtitles_tag.startswith("subtitles:zip/"):
        (hash, name) = subtitles_tag.split("subtitles:zip/")[1].split("/", 1)
        data = api_zipget(hash=hash, subname=name)
    else:
        subtitles_hash = subtitles_tag.split("subtitles:")[1]
        name = ITEMS[subtitles_hash]["name"]
        print(subtitles_hash)
        data = get_api_data(hash=subtitles_hash)

    return subtitles.convert(name=name, data=data)


def get_api_data(hash):
    global ITEMS
    item = ITEMS[hash]
    name = item["name"]
    service = item["service"]

    data = b''.join(whole(hash, service=service))
    return data


@app.route('/api/data/<hash>')
def api_data(hash):
    global ITEMS
    item = ITEMS[hash]
    name = item["name"]
    size = item["size"]

    data = get_api_data(hash)
    resp = Response(data)
    resp.headers.add('Content-Type', get_mimetype_from_hash(hash))
    resp.headers.add('Content-Length', size)
    resp.headers.add('Content-Disposition',
        f'''inline; filename="{urllib.parse.quote(name, encoding='utf-8')}"''')
    return resp


@app.route('/stream/<hash>', methods=['GET', 'OPTIONS'])
def stream(hash):
    global ITEMS
    item = ITEMS[hash]
    # logger.info(hash)
    file_size = item["size"]
    range_header = request.headers.get('Range', None)

    byte1, byte2 = 0, None
    if range_header:
        match = re.search(r'(\d+)-(\d*)', range_header)
        groups = match.groups()

        if groups[0]:
            byte1 = int(groups[0])
        if groups[1]:
            byte2 = int(groups[1])

    offset = byte1
    # length = file_size - offset
    # length = min(2**20, file_size)
    nr = next_read()
    length = min(nr, file_size)
    if byte2:
        length = min(byte2 - byte1 + 1, length)  # NOTE: this prevents iOS from asking for 4GB at a time.

    logger.info(f"[ ] nr/file_size/byte2/length" + repr((nr, file_size, byte2, length)))
    logger.info(f"[ ] Getting {length} bytes...")

    name = item["name"]
    mimetype = mimetypes.guess_type(name)[0]
    # logger.info(mimetypes.guess_type(name))
    if mimetype == 'audio/mp4a-latm':
        mimetype = 'audio/mp4'
    # elif mimetype == 'video/quicktime':
    #     mimetype = 'video/mp4'
    service = item["service"]

    chunk = b''.join(video(hash, offset, length, service=service))
    resp = Response(chunk, 206, mimetype=mimetype, content_type=mimetype, direct_passthrough=True)
    resp.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(offset, offset + len(chunk) - 1, file_size))
    # resp.headers.add('Content-Type', "application/octet-stream")
    # resp.headers.add('Transfer-Encoding', "chunked")
    resp.headers.add('Content-Disposition',
        f'''inline; filename="{urllib.parse.quote(name, encoding='utf-8')}"''')
    logger.info(f"\tReturning {len(chunk)} bytes")
    return resp


# if __name__ == '__main__':
#     app.run(threaded=False)

reload_list()
app.run(threaded=False)
