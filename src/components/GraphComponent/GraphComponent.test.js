import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import GraphComponent from './GraphComponent';

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

  beforeAll(() => {
    spy(GraphComponent.prototype, 'componentDidMount');
  });

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

  it('with displayed nodes', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3']}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg path.link')).to.have.lengthOf(0);
    expect(wrapper.find('svg circle.node')).to.have.lengthOf(3);
  });

  it('with displayed links', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg circle.node')).to.have.lengthOf(4);
    expect(wrapper.find('svg path.link')).to.have.lengthOf(1);
  });

  it('toolbar', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );

    wrapper.find('div.toolbar button.table-btn').simulate('click');
    wrapper.find('div.toolbar button#graph-options-btn').simulate('click');
    wrapper.find('input#linkStrength').simulate('change');
    wrapper.find('div.toolbar .refresh-wrapper button').simulate('click');
  });

  it('clicking nodes and links', () => {
    const handleClick = jest.fn();
    const handleDetailDrawerOpen = jest.fn();

    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={handleClick}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );
    wrapper.find('circle.node').first().simulate('click');
    wrapper.find('path.link').first().simulate('click');
    expect(handleClick.mock.calls.length).to.eq(1);
    expect(handleDetailDrawerOpen.mock.calls.length).to.eq(1);
  });

  it('Different init types', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        edgeTypes={['AliasOf']}
      />,
    );
    expect(wrapper.find('circle.node')).to.have.lengthOf(4);
    wrapper.find('circle.node').first().simulate('click');
    wrapper.find('#close').simulate('click');
  });
});
