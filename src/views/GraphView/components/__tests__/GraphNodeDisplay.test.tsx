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
          actionsNode={null}
          applyDrag={jest.fn()}
          color={undefined}
          detail={null}
          handleClick={jest.fn()}
          labelKey="name"
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
          actionsNode={null}
          applyDrag={jest.fn()}
          color={undefined}
          detail={null}
          handleClick={jest.fn()}
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
          actionsNode={new GraphNode(detail)}
          applyDrag={jest.fn()}
          color={undefined}
          detail={detail}
          handleClick={jest.fn()}
          labelKey="source.name"
          node={mockData}
        />
      </svg>,
    );

    const text = screen.getByText('node source').closest('text');
    expect(text.getAttribute('style').includes('opacity: 0.6')).toBeTruthy();
  });

  test('successfully applies drag function to node (doesn\'t test triggering)', () => {
    const applyDrag = jest.fn();
    const { container } = render(
      <svg>
        <GraphNodeDisplay
          actionsNode={null}
          applyDrag={applyDrag}
          color={undefined}
          detail={null}
          handleClick={jest.fn()}
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
