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
        data={{ mockData }}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3']}
      />,
    );
    console.log(wrapper);
  });
});
