import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent,
  render,
} from '@testing-library/react';
import React from 'react';

import AdvancedSearchView from '..';

jest.mock('@/components/RecordAutocomplete', () => (({
  value, onChange, name, label,
}) => {
  const handleChange = () => {
    onChange({ target: { value: [{ displayName: 'value', '@rid': '1:1' }], name } });
  };

  return (
    <select data-testid="value-select" onChange={handleChange} value={value}>
      <option key="test" value={value}>
        {label}
      </option>
    </select>
  );
}));

/* eslint-disable react/prop-types */
jest.mock('@/components/DropDownSelect', () => ({
  options = [], value, onChange, name, innerProps: { 'data-testid': testId = 'select' } = {},
}) => {
  const handleChange = (event) => {
    const option = options.find(
      opt => (opt.value === undefined ? opt : opt.value) === event.currentTarget.value,
    );

    onChange({ target: { value: option.value === undefined ? option : option.value, name } });
  };
  return (
    <select data-testid={testId} onChange={handleChange} value={value}>
      {options.map(opt => (
        <option key={opt.key || opt} value={opt.value === undefined ? opt : opt.value}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
});
/* eslint-enable react/prop-types */

describe('AdvancedSearchView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockPush = jest.fn();

  const mockHistory = {
    push: event => mockPush(event),
  };

  let getByTestId;
  let getByText;

  beforeEach(() => {
    ({
      getByTestId, getByText,
    } = render(
      <AdvancedSearchView
        history={mockHistory}
      />,
    ));
  });

  test.skip('add filter button is disabled on render', async () => {
    expect(getByText('ADD FILTER')).toBeInTheDocument();
    expect(getByText('ADD FILTER')).toBeDisabled();
  });

  test.skip('search button fires correctly', () => {
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQifQ%253D%253D&%40class=Statement&searchChipProps%5BsearchType%5D=Advanced');
  });


  test('renders new filter group correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value-select'), { target: { name: 'value', value: [{ displayName: 'value', '@rid': '1:1' }] } });
    expect(getByText('ADD FILTER')).toBeInTheDocument();
    expect(getByText('ADD FILTER')).not.toBeDisabled();
    await fireEvent.click(getByText('ADD FILTER'));
    expect(getByText('relevance = \'value (1:1)\'')).toBeInTheDocument();
  });

  test.skip('fires new search correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value'), { target: { value: [{ displayName: 'value', '@rid': '1:1' }] } });
    await fireEvent.click(getByText('ADD FILTER'));
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7Ik9SIjpbeyJBTkQiOlt7InJlbGV2YW5jZSI6IjE6MSIsIm9wZXJhdG9yIjoiPSJ9XX1dfX0%253D&%40class=Statement&searchChipProps%5BsearchType%5D=Advanced&searchChipProps%5Bfilters%5D%5B0%5D%5B0%5D=relevance%20%3D%20value');
  });
});
