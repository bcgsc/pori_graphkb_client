import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import { Dialog } from '@material-ui/core';
import GraphOptionsPanel from '../GraphComponent/GraphOptionsPanel';
import { PropsMap, GraphOptions } from '../GraphComponent/kbgraph';

describe('<GraphOptionsPanel />', () => {
  let wrapper;
  const testNodes = [
    { name: 'hello', source: { name: 'test source' } },
    { name: 'goodbye', sourceId: 'test source ID' },
  ];

  beforeAll(() => {
    spy(GraphOptionsPanel.prototype, 'handleHelpOpen');
    spy(GraphOptionsPanel.prototype, 'handleHelpClose');
  });

  it('init', () => {
    const propsMap = new PropsMap();
    testNodes.forEach(t => propsMap.loadNode(t));
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={propsMap}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={() => { }}
      />,
    );
    expect(wrapper.children().first().type()).to.eq(Dialog);
  });

  it('not open', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen={false}
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={jest.fn()}
        handleGraphOptionsChange={jest.fn()}
      />,
    );
    wrapper.children().forEach((child) => {
      expect(child.type()).to.eq(Dialog);
      expect(child.children().props().open).to.eq(false);
    });
  });

  it('close dialog', () => {
    const handleDialogClose = jest.fn();
    const handleGraphOptionsChange = jest.fn();
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={handleDialogClose}
        handleGraphOptionsChange={handleGraphOptionsChange}
      />,
    );
    wrapper.find('button#options-close-btn').simulate('click');
    expect(handleDialogClose.mock.calls.length).to.eq(2);
  });

  it('help dialog', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={() => { }}
      />,
    );
    wrapper.find('.options-title button#main-help-btn').simulate('click');
    expect(wrapper.children().length).to.eq(2);
    wrapper.find('.help-title button').simulate('click');

    wrapper.find('.options-title button#advanced-help-btn').simulate('click');
    expect(wrapper.children().length).to.eq(2);
    wrapper.find('.help-title button').simulate('click');

    expect(GraphOptionsPanel.prototype.handleHelpOpen).to.have.property('callCount', 2);
    expect(GraphOptionsPanel.prototype.handleHelpClose).to.have.property('callCount', 2);
  });

  it('advanced options changes', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={() => { }}
      />,
    );
    wrapper.find('div.advanced-options-wrapper input')
      .forEach(input => input.simulate('change'));

    wrapper.find('div.main-options-wrapper input')
      .forEach(input => input.simulate('change'));
  });
});
