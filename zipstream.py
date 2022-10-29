"""
Zipstream allows you to lazy-load ZIP files for reading.

Using this module, you can partially read ZIP files (with data coming from
whatever seekable API you have access to) into memory only when necessary.

Example usage:
    stream = ...  # Some function with the signature (offset, length) -> bytes
    size = ...  # The total size in bytes of the ZipFile

    zipfile = zipstream(stream, size)
    zipfile.namelist()
    zipfile.read(...)
    zipfile.extract(...)
"""

import logging
import zipfile
from typing import Callable, ByteString

logger = logging.getLogger(__name__)


__all__ = [
    "zipstream",
]


TSeekableStream = Callable[[int, int], ByteString]


class FilelikeSeekableStream:
    def __init__(self, stream: TSeekableStream, size: int):
        self._stream = stream
        self._size = size
        self._seek = 0

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        logger.debug("seek: offset=%i, whence=%i", offset, whence)
        if whence == 0:
            self._seek = offset
        elif whence == 1:
            self._seek = self._seek + offset
        elif whence == 2:
            self._seek = self._size + offset
        else:
            raise RuntimeError(f"invalid value for whence: {repr(whence)}")
        logger.debug("seek: new seek=%i", self._seek)

    def tell(self):
        out = self._seek
        logger.debug("tell: out=%i", out)
        return out

    def read(self, length=0):
        logger.debug("read: length=%i", length)
        if not length:
            length = self._size - self._seek

        out = self._stream(self._seek, length)

        self._seek = min(self._seek + length, self._size)
        logger.debug("read: len(out)=%i, new seek=%i", len(out), self._seek)
        return out


def zipstream(stream, size):
    filelike_seekable_stream = FilelikeSeekableStream(stream, size)
    return zipfile.ZipFile(filelike_seekable_stream)
