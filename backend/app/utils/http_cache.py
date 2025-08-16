import hashlib
import orjson

def serialize_payload(payload: dict) -> bytes:
    return orjson.dumps(payload)

def compute_etag(payload: dict, schema_version: int) -> str:
    payload_bytes = serialize_payload(payload)
    version_bytes = f"v{schema_version}".encode()
    etag = hashlib.sha256(version_bytes + payload_bytes).hexdigest()
    return etag

def check_if_not_modified(request_etag: str, computed_etag: str) -> bool:
    return bool(request_etag and request_etag == computed_etag)
