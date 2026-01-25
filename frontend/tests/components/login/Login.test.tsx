import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import Login from '../../../src/components/login/Login';

vi.mock('../../../src/assets/steam-button-vertical.png', () => ({
  default: 'mocked-steam-button.png',
}));

describe('Login', () => {
  beforeEach(() => {
    render(<Login />);
  });

  it('links to the correct auth URL', () => {
    const link = page.getByRole('link');
    expect(link).toHaveAttribute('href', 'http://domain/auth/login');
  });

  it('displays the Steam login image with correct src', () => {
    const img = page.getByRole('img', { name: 'Steam logo' });
    expect(img).toHaveAttribute('src', 'mocked-steam-button.png');
  });
});
