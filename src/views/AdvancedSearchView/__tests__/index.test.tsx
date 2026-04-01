import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';

import AdvancedSearchView from '..';

function LocationSpy({ onChange }) {
  const location = useLocation();
  useEffect(() => {
    onChange({
      search: location.search,
      pathname: location.pathname,
    }, { state: location.state });
  }, [location, onChange]);
  return null;
}

vi.mock('@/components/RecordAutocomplete', () => ({
  default: ({
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
  },
}));

vi.mock('@/components/DropDownSelect', () => ({
  default: ({
    options = [], value, onChange, name, innerProps: { 'data-testid': testId = 'select' } = {},
  }) => {
    const handleChange = (event) => {
      const option = (options as any[]).find(
        (opt) => (opt.value === undefined ? opt : opt.value) === event.currentTarget.value,
      );

      onChange({ target: { value: option.value === undefined ? option : option.value, name } });
    };
    return (
      <select data-testid={testId} onChange={handleChange} value={value}>
        {(options as any[]).map((opt) => (
          <option key={opt.key || opt} value={opt.value === undefined ? opt : opt.value}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    );
  },
}));

describe('AdvancedSearchView', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('search button fires correctly', () => {
    const navigate = vi.fn();

    render(
      <BrowserRouter>
        <LocationSpy onChange={navigate} />
        <AdvancedSearchView />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText('Search'));

    const expectedPath = '/data/table';
    const expectedSearchString = '?%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQifQ%253D%253D';

    expect(navigate).toHaveBeenLastCalledWith({
      pathname: expectedPath,
      search: expectedSearchString,
    }, {
      state: {
        query: {
          target: 'Statement',
        },
      },
    });
  });

  test('renders new filter group correctly', async () => {
    render(
      <BrowserRouter>
        <AdvancedSearchView />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByTestId('prop-select'), { target: { value: 'relevance' } });
    fireEvent.change(screen.getByTestId('value-select'), { target: { name: 'value', value: [{ displayName: 'value', '@rid': '1:1' }] } });
    expect(screen.getByText('add to selected group')).toBeInTheDocument();
    expect(screen.getByText('add to selected group')).not.toBeDisabled();
    fireEvent.click(screen.getByText('add to selected group'));
    expect(screen.getByText('relevance IN value (1:1)')).toBeInTheDocument();
  });

  test('fires new search correctly', async () => {
    const navigate = vi.fn();

    render(
      <BrowserRouter>
        <LocationSpy onChange={navigate} />
        <AdvancedSearchView />
      </BrowserRouter>,
    );
    fireEvent.change(screen.getByTestId('prop-select'), { target: { value: 'relevance' } });
    fireEvent.change(screen.getByTestId('value-select'), { target: { value: [{ displayName: 'value', '@rid': '1:1' }], name: 'value' } });
    fireEvent.click(screen.getByText('add to selected group'));
    fireEvent.click(screen.getByText('Search'));

    const expectedPath = '/data/table';
    const expectedSearchString = '?%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjpbeyJvcGVyYXRvciI6IklOIiwicmVsZXZhbmNlIjpbIjE6MSJdfV19';

    expect(navigate).toHaveBeenLastCalledWith({
      pathname: expectedPath,
      search: expectedSearchString,
    }, {
      state: {
        query: {
          target: 'Statement',
          filters: [{
            operator: 'IN',
            relevance: ['1:1'],
          }],
        },
      },
    });
  });
});
