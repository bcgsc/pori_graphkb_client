/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import {
  afterEach,
  describe, expect, test, vi,
} from 'vitest';

import GraphOptionsPanel from '../GraphComponent/GraphOptionsPanel/GraphOptionsPanel';
import { GraphOptions, PropsMap } from '../GraphComponent/kbgraph';

vi.mock('../../../../components/DropDownSelect', () => ({
  default: ({
    options = [], value, onChange, name,
  }) => {
    const handleChange = (event) => {
      const option = options.find(
        (opt) => opt === event.currentTarget.value,
      );
      onChange({ target: { value: option, name } });
    };
    return (
      <select data-testid={`${name}`} onChange={handleChange} value={value}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  },
}));

describe('<GraphOptionsPanel />', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const testNodes = [
    { name: 'hello', source: { name: 'test source' } },
    { name: 'goodbye', sourceId: 'test source ID' },
  ];

  const propsMap = new PropsMap();
  testNodes.forEach((t) => propsMap.loadNode(t));

  const handleDialogClose = vi.fn();
  const handleGraphOptionsChange = vi.fn();

  const defaultProps = {
    graphOptions: new GraphOptions(),
    graphOptionsOpen: true,
    handleDialogClose,
    handleGraphOptionsChange,
    linkLegendDisabled: true,
    propsMap,
  };

  test('renders Dialog Correctly', () => {
    const { getByText } = render(
      <GraphOptionsPanel {...defaultProps} />,
    );
    expect(getByText('Graph Options')).toBeInTheDocument();
    expect(getByText('Label nodes by preview')).toBeInTheDocument();
    expect(getByText('Show Nodes Coloring Legend')).toBeInTheDocument();
    expect(getByText('Show Links Coloring Legend')).toBeInTheDocument();
    expect(getByText('Use a Weak Tree layout')).toBeInTheDocument();
  });

  test('passes on open prop to child dialog', () => {
    render(
      <GraphOptionsPanel
        {...defaultProps}
        graphOptionsOpen={false}
      />,
    );

    expect(screen.queryByText('Graph Options')).toBeFalsy();
  });

  test('triggers the handler when dialog closes', () => {
    const { getByTestId } = render(
      <GraphOptionsPanel {...defaultProps} />,
    );
    const optionsBtn = getByTestId('close-btn');
    fireEvent.click(optionsBtn);

    expect(handleDialogClose).toHaveBeenCalledTimes(1);
  });

  test('opens and renders help dialog when help buttons are clicked', async () => {
    const { getByTestId, getByText } = render(
      <GraphOptionsPanel {...defaultProps} />,
    );
    const helpBtn = getByTestId('main-help-btn');
    await fireEvent.click(helpBtn);
    expect(getByText('Graph Options Help')).toBeInTheDocument();
  });

  test('options changes trigger the handler', () => {
    const { getByTestId } = render(
      <GraphOptionsPanel {...defaultProps} />,
    );

    const edgeLabelInput = getByTestId('linkLabelProp');
    fireEvent.change(edgeLabelInput, { target: { name: 'linkLabelProp', value: 'test' } });

    expect(handleGraphOptionsChange.mock.calls.length).toBeGreaterThan(0);
  });
});
