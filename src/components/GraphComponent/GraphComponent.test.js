import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import GraphComponent from './GraphComponent';

spy(GraphComponent.prototype, 'componentDidMount');

const mockData = {
  '#1': {
    '@rid': '#1',
    name: 'test one',
    sourceId: 'test-1',
    out_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
  '#2': {
    '@rid': '#2',
    name: 'test two',
    sourceId: 'test-2',
    source: {
      name: 'test source',
    },
  },
  '#3': {
    '@rid': '#3',
    name: 'test three',
    sourceId: 'test-3',
  },
  '#4': {
    '@rid': '#4',
    name: 'linked',
    sourceId: 'test-4',
    in_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
};


describe('<GraphComponent />', () => {
  let wrapper;
  it('init', () => {
    wrapper = mount(
      <GraphComponent
        data={{}}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
      />,
    );
    expect(GraphComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });

  it('', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3']}
        edges={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg path.link')).to.have.lengthOf(0);
    expect(wrapper.find('svg circle.node')).to.have.lengthOf(3);
  });

  it('', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edges={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg circle.node')).to.have.lengthOf(4);
    expect(wrapper.find('svg path.link')).to.have.lengthOf(1);
  });
});
