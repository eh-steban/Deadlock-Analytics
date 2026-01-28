# SOLID Principles

Apply SOLID principles across all services to maintain clean, maintainable code.

## Single Responsibility Principle (SRP)

**A class/module should have one, and only one, reason to change.**

### Examples

✅ **Good:**
```python
# Each class has one responsibility
class UserRepository:
    def save(self, user): ...
    def find_by_id(self, id): ...

class EmailService:
    def send_email(self, to, subject, body): ...

class UserRegistrationUseCase:
    def __init__(self, user_repo, email_service):
        self.user_repo = user_repo
        self.email_service = email_service

    def execute(self, user_data):
        user = self.user_repo.save(user_data)
        self.email_service.send_email(user.email, "Welcome", "...")
```

❌ **Bad:**
```python
# UserService has too many responsibilities
class UserService:
    def save_user(self, user): ...  # Database
    def send_welcome_email(self, user): ...  # Email
    def validate_user(self, user): ...  # Validation
    def generate_report(self, user): ...  # Reporting
```

### Application

- **Backend**: Separate routes (HTTP), use cases (orchestration), repositories (data), services (domain logic)
- **Frontend**: Separate components (UI), hooks (state/data), services (API calls), utils (pure functions)
- **Parser**: Separate handlers (HTTP), demo operations (file management), parsing (data extraction)

---

## Open/Closed Principle (OCP)

**Software entities should be open for extension but closed for modification.**

### Examples

✅ **Good:**
```python
# Abstract base allows extension without modification
class DamageCalculator(ABC):
    @abstractmethod
    def calculate(self, raw_damage, target): ...

class PhysicalDamageCalculator(DamageCalculator):
    def calculate(self, raw_damage, target):
        return raw_damage * (1 - target.armor / 100)

class MagicalDamageCalculator(DamageCalculator):
    def calculate(self, raw_damage, target):
        return raw_damage * (1 - target.magic_resist / 100)
```

❌ **Bad:**
```python
# Adding new damage types requires modifying existing code
def calculate_damage(damage_type, raw_damage, target):
    if damage_type == "physical":
        return raw_damage * (1 - target.armor / 100)
    elif damage_type == "magical":
        return raw_damage * (1 - target.magic_resist / 100)
    # Need to modify this function for every new damage type
```

### Application

- Use interfaces/abstract base classes for extensible behavior
- Prefer composition over modification
- Use dependency injection to swap implementations

---

## Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types.**

### Examples

✅ **Good:**
```python
class Storage(ABC):
    @abstractmethod
    def save(self, key, data): ...
    @abstractmethod
    def load(self, key): ...

class PostgresStorage(Storage):
    def save(self, key, data):
        # Saves to PostgreSQL
        pass

    def load(self, key):
        # Loads from PostgreSQL
        return data

class S3Storage(Storage):
    def save(self, key, data):
        # Saves to S3
        pass

    def load(self, key):
        # Loads from S3
        return data

# Both can be used interchangeably
def store_match_data(storage: Storage, match_id, data):
    storage.save(match_id, data)
```

❌ **Bad:**
```python
class Storage(ABC):
    @abstractmethod
    def save(self, key, data): ...

class DatabaseStorage(Storage):
    def save(self, key, data):
        # Requires connection to be established first
        if not self.connection:
            raise Exception("Must call connect() first")
        # Violates LSP - different preconditions than base

# S3Storage requires authentication differently
class S3Storage(Storage):
    def save(self, key, data):
        # Requires AWS credentials to be set globally
        # Violates LSP - different setup required
```

### Application

- Subtypes should not strengthen preconditions or weaken postconditions
- Behavioral substitutability, not just structural
- Don't throw exceptions for operations the base type doesn't throw

---

## Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they don't use.**

### Examples

✅ **Good:**
```python
# Separate interfaces for different concerns
class Readable(Protocol):
    def read(self) -> bytes: ...

class Writable(Protocol):
    def write(self, data: bytes) -> None: ...

class ReadOnlyFile:
    def read(self) -> bytes: ...

class ReadWriteFile:
    def read(self) -> bytes: ...
    def write(self, data: bytes) -> None: ...
```

❌ **Bad:**
```python
# Fat interface forces unnecessary implementations
class FileOperations(ABC):
    @abstractmethod
    def read(self): ...

    @abstractmethod
    def write(self, data): ...

    @abstractmethod
    def compress(self): ...

    @abstractmethod
    def encrypt(self): ...

# Read-only file forced to implement write/compress/encrypt
class ReadOnlyFile(FileOperations):
    def read(self): return self.data
    def write(self, data): raise NotImplementedError  # Forced to implement
    def compress(self): raise NotImplementedError  # Forced to implement
    def encrypt(self): raise NotImplementedError  # Forced to implement
```

### Application

- Keep interfaces small and focused
- Use multiple specific interfaces rather than one general interface
- Clients should only know about methods they use

---

## Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions.**

### Examples

✅ **Good:**
```python
# High-level module depends on abstraction
class MatchAnalysisUseCase:
    def __init__(
        self,
        parser_service: ParserService,  # Abstraction
        api_service: APIService,  # Abstraction
        repository: Repository  # Abstraction
    ):
        self.parser = parser_service
        self.api = api_service
        self.repo = repository

    def execute(self, match_id):
        # Can swap implementations without changing this code
        data = self.parser.parse(match_id)
        self.repo.save(data)
```

❌ **Bad:**
```python
# High-level module depends on concrete implementations
class MatchAnalysisUseCase:
    def __init__(self):
        self.parser = RustParserHTTPClient("http://parser:9000")  # Concrete
        self.db = PostgresRepository("postgresql://...")  # Concrete
        self.api = DeadlockAPIClient("https://api.deadlock.com")  # Concrete

    def execute(self, match_id):
        # Tightly coupled to specific implementations
        # Hard to test, hard to swap implementations
        data = self.parser.parse(match_id)
        self.db.save(data)
```

### Application

- Inject dependencies via constructor or parameters
- Define interfaces for all external dependencies
- Use dependency injection frameworks where appropriate (FastAPI's Depends, etc.)
- Make testing easier by allowing mock implementations

---

## Practical Guidelines

### Module Organization

**Bad:**
```
parser/src/
└── main.rs  (1000+ lines with everything)
```

**Good:**
```
parser/src/
├── main.rs  (< 100 lines, just server setup)
├── config.rs  (Configuration)
├── handlers/  (HTTP request handlers)
│   ├── mod.rs
│   ├── check_demo.rs
│   └── parse_demo.rs
├── demo/  (Demo file operations)
│   ├── mod.rs
│   ├── downloader.rs
│   └── decompressor.rs
└── parser/  (Replay parsing logic)
    ├── mod.rs
    └── replay_parser.rs
```

### When to Create a New Module

Create a new module/class when:
1. A file exceeds ~200-300 lines
2. A class/function has multiple responsibilities
3. Logic could be reused in different contexts
4. Testing would be easier with separation
5. The code deals with a distinct concern (HTTP, file I/O, parsing, etc.)

### Red Flags

- God objects/modules that do everything
- Classes with many dependencies (> 5-7)
- Long parameter lists (> 4-5 parameters)
- Nested conditionals (> 3 levels deep)
- Duplicate code across modules
- Tight coupling between unrelated modules

---

## Service-Specific Applications

### Backend (Python/FastAPI)

- **SRP**: Separate routes, use cases, repositories, domain services
- **OCP**: Use abstract base classes for extensible behavior
- **LSP**: Ensure repository implementations are truly interchangeable
- **ISP**: Define focused protocols (Readable, Writable, Cacheable)
- **DIP**: Inject all dependencies (database, APIs, services)

### Frontend (React/TypeScript)

- **SRP**: Separate components, hooks, services, utilities
- **OCP**: Use composition and render props for extensibility
- **LSP**: Ensure component prop contracts are honored by all implementations
- **ISP**: Define focused component interfaces (no "kitchen sink" props)
- **DIP**: Pass dependencies via props/context, not import directly

### Parser (Rust/Axum)

- **SRP**: Separate handlers, file operations, parsing logic
- **OCP**: Use traits for extensible behavior
- **LSP**: Ensure trait implementations truly satisfy contracts
- **ISP**: Define focused traits (Downloader, Decompressor, Parser)
- **DIP**: Pass dependencies via constructors/parameters
