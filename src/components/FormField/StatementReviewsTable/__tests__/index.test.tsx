import '@testing-library/jest-dom/vitest';

import { screen } from '@testing-library/react';
import {
  afterEach, describe, expect,
  test, vi,
} from 'vitest';

import api from '@/services/api';

import { StatementReview } from '../../index.stories';

vi.spyOn(api, 'query').mockImplementation(async () => [{ '@rid': '#19:0', name: 'bob' }]);

describe('StatementReviewsTable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test.each([{ '@rid': '#19:0', name: 'bob' }, '#19:0'])('displays who created review', async (user) => {
    await StatementReview.run({
      args: {
        ...StatementReview.composed.args,
        value: [{
          '@class': 'StatementReview',
          createdBy: user,
          status: 'initial',
          createdAt: 1565376648434,
          comment: 'second',
        }],
      },
    });

    expect(screen.getByText('Reviews')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    await expect(screen.findByText('bob (#19:0)')).resolves.toBeInTheDocument();
  });
});
