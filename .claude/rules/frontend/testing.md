# Frontend Testing Standards

## Philosophy

**Test behavior, not implementation.**

Ask: "What does the user see/do?" not "What does the code do internally?"

## Test Stack

- **Vitest** - Test runner
- **Vitest Browser Mode** - Real browser testing with Playwright
- **vitest-browser-react** - React rendering for browser tests
- **Playwright** - Browser automation (chromium by default)

## Setup Files

- `tests/setup.ts` - Global test setup (cleanup after each test)
- `src/vite-env.d.ts` - TypeScript definitions for Vite env vars
- `vite.config.ts` - Vitest configuration in the `test` block

## Component Tests (Vitest Browser Mode)

```tsx
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PlayerList', () => {
  // ✅ Use beforeEach for rendering - cleanup happens after each test
  beforeEach(() => {
    render(<PlayerList players={mockPlayers} />);
  });

  // ✅ Good - tests user-visible behavior
  it('displays player names', () => {
    expect(page.getByText('Player One')).toBeInTheDocument();
  });

  // ✅ Good - tests user interaction
  it('filters players when team is selected', async () => {
    await page.getByRole('button', { name: /amber team/i }).click();

    expect(page.getByText('Sapphire Player')).not.toBeInTheDocument();
    expect(page.getByText('Amber Player')).toBeInTheDocument();
  });
});

// ❌ Bad - tests implementation details
test('calls setChartData on mount', () => {
  const setChartData = vi.fn();
  render(<DamageVisualization setChartData={setChartData} />);
  expect(setChartData).toHaveBeenCalled();
});
```

## beforeEach vs beforeAll

- **`beforeEach`** - Use for rendering components (cleanup happens between tests)
- **`beforeAll`** - Use for expensive one-time setup that doesn't get modified

## Query Priority

Prefer queries in this order (most to least accessible):

1. `getByRole` — accessible to everyone
2. `getByLabelText` — form fields
3. `getByPlaceholderText` — form fields without labels
4. `getByText` — non-interactive content
5. `getByTestId` — last resort

```tsx
// ✅ Preferred
page.getByRole('button', { name: /submit/i })

// ⚠️ Use sparingly
page.getByTestId('complex-canvas-element')
```

## Hook Tests

Test custom hooks with `vitest-browser-react`:

```tsx
import { renderHook, waitFor } from 'vitest-browser-react';
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
- Use `vi.mock()` for module mocking
- Keep mocks close to tests or in `__mocks__/`

```tsx
import { vi } from 'vitest';

// Mock static assets (images, etc.)
vi.mock('../../../src/assets/steam-button.png', () => ({
  default: 'mocked-image.png',
}));

// Mock environment variables
vi.stubEnv('VITE_BACKEND_DOMAIN', 'api.example.com');
```

## Integration Tests

Test feature flows end-to-end with mocked API:

```tsx
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';

test('complete match analysis flow', async () => {
  render(<MatchAnalysisPage />);

  // User enters match ID
  await page.getByRole('textbox').fill('12345');
  await page.getByRole('button', { name: /analyze/i }).click();

  // Wait for data to load
  await expect.element(page.getByText(/match duration/i)).toBeInTheDocument();

  // User interacts with timeline
  await page.getByRole('slider').click();

  // Verify visualization updates
  expect(page.getByTestId('minimap')).toBeInTheDocument();
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

## Component Testing Hierarchy
1. Critical User Paths → Always test these
2. Error Handling      → Test failure scenarios
3. Edge Cases          → Empty data, extreme values
4. Accessibility       → Screen readers, keyboard nav
5. Performance         → Large datasets, animations
