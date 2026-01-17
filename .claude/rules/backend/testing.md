# Backend Testing Standards

## Domain Tests

Unit test all domain entities, value objects, and domain services:

- Test business rules and invariants
- No mocking of domain internals
- Examples: Hero pick validation, objective capture logic

```python
# ✅ Good domain test
def test_match_event_validates_timestamp():
    with pytest.raises(ValueError):
        MatchEvent(timestamp=-1, event_type="kill", ...)

def test_damage_calculation_applies_armor():
    result = calculate_damage(raw=100, armor=20)
    assert result == 80
```

## Application Tests

Test use cases with mocked infrastructure:

- Mock repositories and external services
- Verify DTOs and data transformations
- Test the orchestration logic

```python
def test_get_match_returns_transformed_data(mock_repo, mock_mapper):
    mock_repo.get_by_id.return_value = some_orm_model
    
    result = GetMatchUseCase(mock_repo, mock_mapper).execute(123)
    
    mock_mapper.to_domain.assert_called_once()
```

## Integration Tests

Strategy TBD — will define when we begin writing integration tests.

Focus areas:
- Repository implementations against test database
- S3 storage operations with LocalStack
- API endpoints end-to-end

## Coverage Goals

| Layer | Target |
|-------|--------|
| Domain | 90%+ |
| Application | 80%+ |
| Infrastructure | Critical paths |
