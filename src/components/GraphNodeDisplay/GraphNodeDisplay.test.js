import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import GraphNodeDisplay from './GraphNodeDisplay';

const mockData = {
  x: 0,
  y: 0,
  data: {
    '@rid': '#1',
    name: 'node',
  },
};

describe('<GraphNodeDisplay />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children().first().type()).to.equal('text');
  });

  it('with label', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
        labelKey="name"
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children('text').text()).to.equal('node');
  });
});
