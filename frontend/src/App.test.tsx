import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders sign in with steam link', () => {
    render(<App />);
    const linkElement = screen.getByText(/Sign in with Steam/i);
    expect(linkElement);
  });
});
