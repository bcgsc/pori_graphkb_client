import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
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
  let wrapper;

  it('renders svg g element with nested paths', () => {
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
      />,
    );
    expect(wrapper.type()).to.equal('g');
    wrapper.children().forEach(child => expect(child.type()).to.equal('path'));
  });

  it('renders label correctly', () => {
    mockData.source.y = mockData.target.y;
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
        labelKey="name"
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children('text').text()).to.equal('link');
  });

  it('reduces opacity if link is not selected for detail viewing', () => {
    mockData.source.x = mockData.target.x;
    const detail = { '@rid': '#2' };
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
        labelKey="source.name"
        detail={detail}
        actionsNode={{ data: detail }}
      />,
    );

    expect(wrapper.find('path.link').props().style.strokeOpacity).to.eq(0.4);
  });

  it('invalid link', () => {
    mockData.source = mockData.target;
    wrapper = shallow(
      <GraphLinkDisplay
        link={mockData}
        labelKey="source.name"
        detail={mockData}
      />,
    );
    expect(wrapper.find('path.link')).to.have.lengthOf(0);
  });
});
