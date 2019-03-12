import React from 'react';
import { mount } from 'enzyme';
import GraphLegend from '../GraphComponent/GraphLegend/GraphLegend';
import { PropsMap } from '../GraphComponent/kbgraph';

describe('<GraphLegend />', () => {
  it('does not crash', () => {
    const onChange = jest.fn();
    const wrapper = mount(
      <GraphLegend
        graphOptions={{
          nodesLegend: true,
          nodesColor: true,
          linksColor: true,
          linksLegend: true,
          nodesColors: { color1: 'white' },
          linksColors: { color2: 'black' },
        }}
        propsMap={new PropsMap()}
        onChange={onChange}
        linkDisabled={false}
      />,
    );

    wrapper.find('button[name="nodesLegend"]').simulate('click');
    expect(onChange.mock.calls.length).toBe(1);

    wrapper.find('button[name="linksLegend"]').simulate('click');
    expect(onChange.mock.calls.length).toBe(2);
  });
});
