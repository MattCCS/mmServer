
import io

READY = False
try:
    import webvtt
    READY = True
except ImportError:
    pass


def convert(name, data):
    if name.endswith(".vtt"):
        return data

    if not READY:
        return data

    if name.endswith(".srt"):
        parser = webvtt.parsers.SRTParser()
    elif name.endswith(".sbv"):
        parser = webvtt.parsers.SBVParser()
    else:
        return data

    writer = webvtt.writers.WebVTTWriter()
    return _convert(parser=parser, writer=writer, data=data)


def _convert(parser, writer, data):
    print(data[:50])
    io_in = io.StringIO(data.decode("utf-8-sig"))  # TODO: yuck.
    io_out = io.StringIO()

    parser.read_from_buffer(io_in)
    writer.write(parser.captions, io_out)

    io_out.seek(0)
    return io_out.read()
