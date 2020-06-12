import '@testing-library/jest-dom/extend-expect';

import { Dialog } from '@material-ui/core';
import {
  fireEvent, render,
} from '@testing-library/react';
import { mount } from 'enzyme';
import React from 'react';

import GraphOptionsPanel from '../GraphComponent/GraphOptionsPanel/GraphOptionsPanel';
import { GraphOptions, PropsMap } from '../GraphComponent/kbgraph';

/* eslint-disable react/prop-types */
jest.mock('../../../../components/DropDownSelect', () => ({
  options = [], value, onChange, name,
}) => {
  const handleChange = (event) => {
    const option = options.find(
      opt => opt === event.currentTarget.value,
    );
    onChange({ target: { value: option, name } });
  };
  return (
    <select data-testid={`${name}`} onChange={handleChange} value={value}>
      {options.map(opt => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
});

describe('<GraphOptionsPanel />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let wrapper;
  const testNodes = [
    { name: 'hello', source: { name: 'test source' } },
    { name: 'goodbye', sourceId: 'test source ID' },
  ];

  const propsMap = new PropsMap();
  testNodes.forEach(t => propsMap.loadNode(t));

  let dom;
  const handleDialogClose = jest.fn();
  const handleGraphOptionsChange = jest.fn();

  beforeEach(() => {
    (dom = render(
      <GraphOptionsPanel
        graphOptions={new GraphOptions()}
        graphOptionsOpen
        handleDialogClose={handleDialogClose}
        handleGraphOptionsChange={handleGraphOptionsChange}
        linkLegendDisabled={false}
        propsMap={propsMap}
      />,
    ));
  });

  test('renders Dialog Correctly', () => {
    const { getByText } = dom;
    expect(getByText('Graph Options')).toBeInTheDocument();
    expect(getByText('Label nodes by preview')).toBeInTheDocument();
    expect(getByText('Show Nodes Coloring Legend')).toBeInTheDocument();
    expect(getByText('Show Links Coloring Legend')).toBeInTheDocument();
    expect(getByText('Use a Weak Tree layout')).toBeInTheDocument();
  });

  test('passes on open prop to child dialog', () => {
    wrapper = mount(
      <GraphOptionsPanel
        graphOptions={new GraphOptions()}
        graphOptionsOpen={false}
        handleDialogClose={jest.fn()}
        handleGraphOptionsChange={jest.fn()}
        linkLegendDisabled={false}
        propsMap={new PropsMap()}
      />,
    );
    wrapper.children().forEach((child) => {
      expect(child.type()).toBe(Dialog);
      expect(child.children().props().open).toBe(false);
    });
  });

  test('triggers the handler when dialog closes', () => {
    const { getByTestId } = dom;
    const optionsBtn = getByTestId('close-btn');
    fireEvent.click(optionsBtn);

    expect(handleDialogClose).toHaveBeenCalledTimes(1);
  });

  test('opens and renders help dialog when help buttons are clicked', async () => {
    const { getByTestId, getByText } = dom;
    const helpBtn = getByTestId('main-help-btn');
    await fireEvent.click(helpBtn);
    expect(getByText('Graph Options Help')).toBeInTheDocument();
  });

  test('options changes trigger the handler', () => {
    const { getByTestId } = dom;

    const edgeLabelInput = getByTestId('linkLabelProp');
    fireEvent.change(edgeLabelInput, { target: { name: 'linkLabelProp', value: 'test' } });

    expect(handleGraphOptionsChange.mock.calls.length).toBeGreaterThan(0);
  });
});
