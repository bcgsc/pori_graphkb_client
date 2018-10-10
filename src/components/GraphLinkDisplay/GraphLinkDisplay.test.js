import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import GraphLinkDisplay from './GraphLinkDisplay';

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
  },
};


describe('<GraphLinkDisplay />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
      />,
    );
    expect(wrapper.type()).to.equal('g');
    wrapper.children().forEach(child => expect(child.type()).to.equal('path'));
  });

  it('with label', () => {
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
        labelKey="name"
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children('text').text()).to.equal('link');
  });
});
