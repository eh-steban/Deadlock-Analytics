import hashlib
import orjson
from fastapi import Response, status

def serialize_payload(payload: dict) -> bytes:
    # Serialize dict to stable bytes using orjson.
    return orjson.dumps(payload)

def compute_etag(payload: dict, schema_version: int) -> str:
    # Compute strong ETag as sha256 of schema_version + payload bytes.
    payload_bytes = serialize_payload(payload)
    version_bytes = f"v{schema_version}".encode()
    etag = hashlib.sha256(version_bytes + payload_bytes).hexdigest()
    return etag

def respond_if_not_modified(request_etag: str, computed_etag: str) -> Response | None:
    # Return 304 Response if ETag matches, else None.
    if request_etag and request_etag == computed_etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)
    return None
