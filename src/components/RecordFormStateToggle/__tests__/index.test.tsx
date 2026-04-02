import '@testing-library/jest-dom/vitest';

import {
  fireEvent, screen,
} from '@testing-library/react';
import {
  afterEach,
  describe, expect, test, vi,
} from 'vitest';

import { RequireConfirm, ViewSelectedEditAllowed } from '../index.stories';

describe('RecordFormStateToggle', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('onClick handler returns new state', async () => {
    await ViewSelectedEditAllowed.run();
    fireEvent.click(screen.getByText('Edit'));
    expect(ViewSelectedEditAllowed.composed.args.onClick).toHaveBeenCalledWith('edit');
  });

  describe('confirm required', () => {
    test('callback is called when confirmed', async () => {
      await RequireConfirm.run();

      expect(screen.getByRole('button', { name: /edit/i })).toBePressed();
      const viewBtn = screen.getByRole('button', { name: /view/i });
      expect(viewBtn).not.toBePressed();
      fireEvent.click(viewBtn);
      fireEvent.click(screen.getByText(/confirm/i));
      expect(RequireConfirm.composed.args.onClick).toHaveBeenCalled();
    });

    test('callback is not called when user cancels', async () => {
      await RequireConfirm.run();

      expect(screen.getByRole('button', { name: /edit/i })).toBePressed();
      const viewBtn = screen.getByRole('button', { name: /view/i });
      expect(viewBtn).not.toBePressed();
      fireEvent.click(viewBtn);
      fireEvent.click(screen.getByText(/cancel/i));
      expect(RequireConfirm.composed.args.onClick).not.toHaveBeenCalled();
    });
  });
});
