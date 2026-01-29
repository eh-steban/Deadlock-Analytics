import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../../../src/components/login/Login';

const testBackendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

vi.mock('../../../src/assets/steam-button-vertical.png', () => ({
  default: 'mocked-steam-button.png',
}));

describe('Login', () => {
  beforeEach(() => {
    render(<Login />);
  });

  it('links to the correct auth URL', () => {
    const link = page.getByRole('link');
    expect(link).toHaveAttribute('href', `http://${testBackendDomain}/auth/login`);
  });

  it('displays the Steam login image with correct src', () => {
    const img = page.getByRole('img', { name: 'Steam logo' });
    expect(img).toHaveAttribute('src', 'mocked-steam-button.png');
  });
});
