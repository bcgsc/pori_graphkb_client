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

  test('add filter button is disabled on render', async () => {
    expect(getByText('add to selected group')).toBeInTheDocument();
    expect(getByText('add to selected group')).toBeDisabled();
  });

  test('search button fires correctly', () => {
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQifQ%253D%253D');
  });


  test('renders new filter group correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value-select'), { target: { name: 'value', value: [{ displayName: 'value', '@rid': '1:1' }] } });
    expect(getByText('add to selected group')).toBeInTheDocument();
    expect(getByText('add to selected group')).not.toBeDisabled();
    await fireEvent.click(getByText('add to selected group'));
    expect(getByText('relevance = value (1:1)')).toBeInTheDocument();
  });

  test('fires new search correctly', async () => {
    await fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
    await fireEvent.change(getByTestId('value-select'), { target: { value: [{ displayName: 'value', '@rid': '1:1' }], name: 'value' } });
    await fireEvent.click(getByText('add to selected group'));
    fireEvent.click(getByText('Search'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/data/table?%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjpbeyJvcGVyYXRvciI6Ij0iLCJyZWxldmFuY2UiOiIxOjEifV19');
  });
});
