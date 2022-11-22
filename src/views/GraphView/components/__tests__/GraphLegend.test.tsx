import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import GraphLegend from '../GraphComponent/GraphLegend/GraphLegend';
import { PropsMap } from '../GraphComponent/kbgraph';

describe('<GraphLegend />', () => {
  test('does not crash', () => {
    const onChange = jest.fn();
    render(
      <GraphLegend
        graphOptions={{
          nodesLegend: true,
          nodesColor: true,
          linksColor: true,
          linksLegend: true,
          nodesColors: { color1: 'white' },
          linksColors: { color2: 'black' },
        }}
        linkDisabled={false}
        onChange={onChange}
        propsMap={new PropsMap()}
      />,
    );

    fireEvent.click(screen.getByLabelText('nodes legend'));
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('links legend'));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
