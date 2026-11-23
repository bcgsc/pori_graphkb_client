import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  describe, expect, test, vi,
} from 'vitest';

import GraphExpansionDialog from '../GraphComponent/GraphExpansionDialog/GraphExpansionDialog';

const testNode = {
  '@rid': '1',
  sourceId: 'hi',
  source: {},
  in_edge: [{
    '@class': 'edge',
    in: { '@rid': '1', source: {} },
    out: { '@rid': '2', source: {} },
  }],
  out_edge: [{
    '@class': 'edge',
    in: { '@rid': '1', source: {} },
    out: { '@rid': '1', source: {} },
  }],
};

describe('<GraphExpansionDialog />', () => {
  test('excludes deleted edges with missing endpoints while allowing active edges to be staged', async () => {
    const user = userEvent.setup();
    const onStage = vi.fn();
    const node = { '@rid': '#1:1', '@class': 'Disease' };
    const target = { '@rid': '#1:2', '@class': 'Disease', name: 'Active neighbor' };

    render(
      <GraphExpansionDialog
        node={{
          ...node,
          in_AliasOf: [
            { '@rid': '#2:1', '@class': 'AliasOf', deletedAt: 123456789 },
            {
              '@rid': '#2:2', '@class': 'AliasOf', in: node, out: target,
            },
          ],
          out_GeneralizationOf: [
            { '@rid': '#3:1', '@class': 'GeneralizationOf', deletedAt: 123456789 },
          ],
        }}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onStage={onStage}
        onStageAll={vi.fn()}
        onStageClass={vi.fn()}
        open
      />,
    );

    expect(screen.queryByRole('button', { name: 'GeneralizationOf' })).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    await user.click(screen.getByText('Active neighbor'));
    expect(onStage).toHaveBeenCalledWith('#2:2');
  });

  test('does not crash', async () => {
    render(
      <GraphExpansionDialog
        node={testNode}
        onClose={vi.fn()}
        onExpand={vi.fn()}
        onStage={vi.fn()}
        onStageAll={vi.fn()}
        onStageClass={vi.fn()}
        open
      />,
    );

    await expect(screen.findByText('Select Edges to Expand')).resolves.toBeTruthy();
  });
});
