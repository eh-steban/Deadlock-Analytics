class MatchDataUnavailableException(Exception):
    """Raised when match data cannot be found or downloaded."""
    pass

class MatchParseException(Exception):
    """Raised when parsing match data fails (e.g., Rust service error)."""
    pass

class MatchDataIntegrityException(Exception):
    """Raised when stored match data is corrupted or cannot be deserialized."""
    pass

class DeadlockAPIError(Exception):
    """Raised when there is an error involving the Deadlock API."""
    pass

class ParserServiceError(Exception):
    """Raised when parser service is unavailable or returns an error."""
    pass