import { Dialog } from '@material-ui/core';
import { mount } from 'enzyme';
import React from 'react';

import GraphOptionsPanel from '../GraphComponent/GraphOptionsPanel/GraphOptionsPanel';
import { GraphOptions, PropsMap } from '../GraphComponent/kbgraph';

describe('<GraphOptionsPanel />', () => {
  let wrapper;
  const testNodes = [
    { name: 'hello', source: { name: 'test source' } },
    { name: 'goodbye', sourceId: 'test source ID' },
  ];

  const handleHelpOpenSpy = jest.spyOn(GraphOptionsPanel.prototype, 'handleHelpOpen');
  const handleHelpCloseSpy = jest.spyOn(GraphOptionsPanel.prototype, 'handleHelpClose');

  test('renders md dialog as first child', () => {
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
    expect(wrapper.children().first().type()).toBe(Dialog);
  });

  test('passes on open prop to child dialog', () => {
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
      expect(child.type()).toBe(Dialog);
      expect(child.children().props().open).toBe(false);
    });
  });

  test('triggers the handler when dialog closes', () => {
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
    expect(handleDialogClose.mock.calls.length).toBe(1);
  });

  test('opens and renders help dialog when help buttons are clicked', () => {
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
    expect(wrapper.children().length).toBe(2);
    wrapper.find('.help-title button').simulate('click');

    expect(handleHelpOpenSpy).toHaveBeenCalledTimes(1);
    expect(handleHelpCloseSpy).toHaveBeenCalledTimes(1);
  });

  test('options changes trigger the handler', () => {
    const handleGraphOptionsChange = jest.fn();
    wrapper = mount(
      <GraphOptionsPanel
        graphOptionsOpen
        graphOptions={new GraphOptions()}
        propsMap={new PropsMap()}
        linkLegendDisabled={false}
        handleDialogClose={() => { }}
        handleGraphOptionsChange={handleGraphOptionsChange}
      />,
    );

    wrapper.find('div.main-options-wrapper input')
      .forEach(input => input.simulate('change'));

    expect(handleGraphOptionsChange.mock.calls.length).toBeGreaterThan(0);
  });
});
