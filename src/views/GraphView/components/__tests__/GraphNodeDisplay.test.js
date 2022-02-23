import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import GraphNodeDisplay from '../GraphComponent/GraphNodeDisplay/GraphNodeDisplay';
import { GraphNode } from '../GraphComponent/kbgraph';

const mockData = new GraphNode(
  {
    '@rid': '#1',
    name: 'node',
    source: {
      name: 'node source',
    },
  },
  0,
  0,
);

describe('<GraphNodeDisplay />', () => {
  test('renders children correctly', () => {
    const { container } = render(
      <svg>
        <GraphNodeDisplay
          node={mockData}
        />
      </svg>,
    );

    const group = container.querySelector('g');
    expect(group).toBeTruthy();
    expect(Array.from(group.children)[0].tagName).toBe('text');
  });

  test('renders correct label', () => {
    render(
      <svg>
        <GraphNodeDisplay
          labelKey="name"
          node={mockData}
        />
      </svg>,
    );
    expect(screen.getByText('node')).toBeTruthy();
  });

  test('mutes node if not selected for detail viewing', () => {
    const detail = { '@rid': '#2' };
    render(
      <svg>
        <GraphNodeDisplay
          actionsNode={{ data: detail }}
          detail={detail}
          labelKey="source.name"
          node={mockData}
        />
      </svg>,
    );

    const text = screen.getByText('node source').closest('text');
    expect(text.getAttribute('style').includes('opacity: 0.6')).toBeTruthy();
  });

  test('does not render invalid node', () => {
    const { container } = render(
      <svg>
        <GraphNodeDisplay
          detail={mockData}
          labelKey="source.name"
          node={null}
        />
      </svg>,
    );

    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  test('successfully applies drag function to node (doesn\'t test triggering)', () => {
    const applyDrag = jest.fn();
    const { container } = render(
      <svg>
        <GraphNodeDisplay
          applyDrag={applyDrag}
          labelKey="source.name"
          node={mockData}
        />
      </svg>,
    );

    const group = container.querySelector('g');
    expect(applyDrag.mock.calls.length).toBe(0);
    fireEvent.drag(group);
    fireEvent.dragStart(group);
  });
});
