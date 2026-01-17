# Frontend Testing Standards

## Philosophy

**Test behavior, not implementation.**

Ask: "What does the user see/do?" not "What does the code do internally?"

## Component Tests (React Testing Library)

```tsx
// ✅ Good - tests user-visible behavior
test('displays damage chart when match data loads', async () => {
  render(<DamageVisualization matchId="123" />);
  
  await waitFor(() => {
    expect(screen.getByRole('img', { name: /damage over time/i })).toBeInTheDocument();
  });
});

// ✅ Good - tests user interaction
test('filters players when team is selected', async () => {
  render(<PlayerList players={mockPlayers} />);
  
  await userEvent.click(screen.getByRole('button', { name: /amber team/i }));
  
  expect(screen.queryByText('Sapphire Player')).not.toBeInTheDocument();
  expect(screen.getByText('Amber Player')).toBeInTheDocument();
});

// ❌ Bad - tests implementation details
test('calls setChartData on mount', () => {
  const setChartData = jest.fn();
  render(<DamageVisualization setChartData={setChartData} />);
  expect(setChartData).toHaveBeenCalled();
});
```

## Query Priority

Prefer queries in this order (most to least accessible):

1. `getByRole` — accessible to everyone
2. `getByLabelText` — form fields
3. `getByPlaceholderText` — form fields without labels
4. `getByText` — non-interactive content
5. `getByTestId` — last resort

```tsx
// ✅ Preferred
screen.getByRole('button', { name: /submit/i })

// ⚠️ Use sparingly
screen.getByTestId('complex-canvas-element')
```

## Hook Tests

Test custom hooks with `@testing-library/react-hooks`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useMatchData } from './useMatchData';

test('fetches and returns match data', async () => {
  const { result } = renderHook(() => useMatchData('123'));
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.match).toBeDefined();
  expect(result.current.match?.id).toBe('123');
});
```

## Mocking

- Mock API layer, not internal functions
- Use MSW (Mock Service Worker) for API mocking
- Keep mocks close to tests or in `__mocks__/`

```tsx
// ✅ Good - mock at API boundary
import { server } from '../mocks/server';
import { rest } from 'msw';

test('handles API error gracefully', async () => {
  server.use(
    rest.get('/api/match/:id', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  render(<MatchAnalysis matchId="123" />);
  
  await waitFor(() => {
    expect(screen.getByText(/error loading match/i)).toBeInTheDocument();
  });
});
```

## Integration Tests

Test feature flows end-to-end with mocked API:

```tsx
test('complete match analysis flow', async () => {
  render(<MatchAnalysisPage />);
  
  // User enters match ID
  await userEvent.type(screen.getByRole('textbox'), '12345');
  await userEvent.click(screen.getByRole('button', { name: /analyze/i }));
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText(/match duration/i)).toBeInTheDocument();
  });
  
  // User interacts with timeline
  await userEvent.click(screen.getByRole('slider'));
  
  // Verify visualization updates
  expect(screen.getByTestId('minimap')).toBeInTheDocument();
});
```

## Visual Regression (Future)

Consider Chromatic/Percy for visualization testing once core features stabilize.

## Coverage Goals

Focus on critical user paths rather than arbitrary coverage numbers:

- Match loading and display
- Timeline navigation
- Player selection and filtering
- Error states and loading states
