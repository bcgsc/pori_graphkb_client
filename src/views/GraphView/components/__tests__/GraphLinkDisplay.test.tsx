import { render, screen } from '@testing-library/react';
import React from 'react';

import GraphLinkDisplay from '../GraphComponent/GraphLinkDisplay/GraphLinkDisplay';

const mockData = {
  target: {
    x: 0,
    y: 0,
  },
  source: {
    x: 240,
    y: 100,
  },
  data: {
    '@rid': '#1',
    name: 'link',
    source: {
      name: 'link source',
    },
  },
};

describe('<GraphLinkDisplay />', () => {
  test('renders svg g element with nested paths', () => {
    const { container } = render(
      <svg>
        <GraphLinkDisplay
          link={mockData}
        />
      </svg>,
    );

    const group = container.querySelector('g');
    expect(group).toBeTruthy();
    Array.from(group.children).forEach((child) => expect(child.tagName).toBe('path'));
  });

  test('renders label correctly', () => {
    mockData.source.y = mockData.target.y;

    render(
      <svg>
        <GraphLinkDisplay
          labelKey="name"
          link={mockData}
        />
      </svg>,
    );
    const link = screen.getByText('link').closest('text');
    expect(link).toBeTruthy();
  });

  test('reduces opacity if link is not selected for detail viewing', () => {
    mockData.source.x = mockData.target.x;
    const detail = { '@rid': '#2' };

    render(
      <svg>
        <GraphLinkDisplay
          actionsNode={{ data: detail }}
          detail={detail}
          labelKey="source.name"
          link={mockData}
        />
      </svg>,
    );

    const link = screen.getByText('link source').closest('text');

    expect(link.getAttribute('opacity')).toEqual('0.4');
  });

  test('invalid link', () => {
    mockData.source = mockData.target;
    render(
      <GraphLinkDisplay
        detail={mockData}
        labelKey="source.name"
        link={mockData}
      />,
    );

    expect(screen.queryByText('link source')).toBeFalsy();
  });
});
