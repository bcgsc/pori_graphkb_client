import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import DropDownSelect from '..';

describe('DropDownSelect', () => {
  test('renders FormControl child correctly', () => {
    const { getByText, queryByText } = render(
      <DropDownSelect
        options={['blargh', 'monkeys']}
        value="blargh"
      />,
    );
    expect(getByText('blargh')).toBeInTheDocument();
    expect(queryByText('monkeys')).not.toBeInTheDocument();
  });

  test('props are passed down correctly', () => {
    const { getByText } = render(
      <DropDownSelect
        label="select something"
        options={['blargh', 'monkeys']}
        value="monkeys"
      />,
    );
    expect(getByText('select something')).toBeInTheDocument();
  });
});
