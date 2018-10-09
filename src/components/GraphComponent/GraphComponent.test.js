import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import GraphComponent from './GraphComponent';

spy(GraphComponent.prototype, 'componentDidMount');

describe('<FormTemplater />', () => {
  let wrapper;
  it('init', () => {
    wrapper = mount(
      <GraphComponent
        data={{}}
        handleDetailDrawerOpen={() => {}}
        handleDetailDrawerClose={() => {}}
        handleTableRedirect={() => {}}
        handleNewColumns={() => {}}
      />,
    );
    expect(GraphComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });
});
