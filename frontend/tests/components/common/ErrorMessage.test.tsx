import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage } from '../../../src/components/common/ErrorMessage';

describe('ErrorMessage', () => {
  describe('Display and Visibility', () => {
    it('displays error message from Error object', () => {
      render(<ErrorMessage error={new Error('Test error message')} />);
      expect(page.getByText(/test error message/i)).toBeInTheDocument();
    });

    it('displays error message from string', () => {
      render(<ErrorMessage error="String error message" />);
      expect(page.getByText(/string error message/i)).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(
        <ErrorMessage
          error={new Error('Test error')}
          title="Custom Error Title"
        />
      );
      expect(page.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('displays default title when not provided', () => {
      render(<ErrorMessage error={new Error('Test error message')} />);
      expect(page.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
    });
  });

  describe('Error Type Detection', () => {
    it('detects 404 errors from message', () => {
      render(<ErrorMessage error={new Error('404 Not Found')} />);
      // Should show "not found" message
      expect(page.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  describe('User-Friendly Messages', () => {
    it('converts "Replay URL not found" to user-friendly message', () => {
      render(<ErrorMessage error={new Error('Replay URL not found')} />);
      expect(
        page.getByText(/this match replay is not available/i)
      ).toBeInTheDocument();
      expect(
        page.getByText(/may not have been uploaded yet/i)
      ).toBeInTheDocument();
    });

    it('converts 502 Bad Gateway to user-friendly message', () => {
      render(<ErrorMessage error={new Error('502 Bad Gateway')} />);
      expect(
        page.getByText(/parser service is temporarily unavailable/i)
      ).toBeInTheDocument();
    });

    it('converts 503 Service Unavailable to user-friendly message', () => {
      render(<ErrorMessage error={new Error('503 Service Unavailable')} />);
      expect(
        page.getByText(/service is temporarily unavailable/i)
      ).toBeInTheDocument();
    });

    it('converts timeout errors to user-friendly message', () => {
      render(<ErrorMessage error={new Error('Request timeout')} />);
      expect(
        page.getByText(/request took too long to complete/i)
      ).toBeInTheDocument();
      expect(page.getByText(/server may be busy/i)).toBeInTheDocument();
    });

    it('converts network errors to user-friendly message', () => {
      render(<ErrorMessage error={new Error('Network error: Failed to fetch')} />);
      expect(
        page.getByText(/unable to connect to the server/i)
      ).toBeInTheDocument();
      expect(
        page.getByText(/check your internet connection/i)
      ).toBeInTheDocument();
    });

    it('keeps 404 messages as-is', () => {
      render(<ErrorMessage error={new Error('Match 123 not found')} />);
      expect(page.getByText(/match 123 not found/i)).toBeInTheDocument();
    });

    it('returns original message for unrecognized errors', () => {
      render(<ErrorMessage error={new Error('Some unknown error')} />);
      expect(page.getByText(/some unknown error/i)).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('displays retry button when onRetry is provided', () => {
      render(
        <ErrorMessage
          error={new Error('Test error')}
          onRetry={() => {}}
        />
      );
      expect(page.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      render(
        <ErrorMessage
          error={new Error('Test error')}
          onRetry={onRetry}
        />
      );

      await page.getByRole('button', { name: /try again/i }).click();
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('retry button is present for 404 errors', () => {
      render(
        <ErrorMessage
          error={new Error('404 Not Found')}
          onRetry={() => {}}
        />
      );
      expect(page.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('retry button is present for timeout errors', () => {
      render(
        <ErrorMessage
          error={new Error('Request timeout')}
          onRetry={() => {}}
        />
      );
      expect(page.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('retry button is present for server errors', () => {
      render(
        <ErrorMessage
          error={new Error('500 Internal Server Error')}
          onRetry={() => {}}
        />
      );
      expect(page.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders heading with title', () => {
      render(
        <ErrorMessage
          error={new Error('Test error')}
          title="Test Title"
        />
      );
      expect(page.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('renders retry button when onRetry provided', () => {
      render(
        <ErrorMessage
          error={new Error('Test error')}
          onRetry={() => {}}
        />
      );
      const button = page.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });
  });
});
