import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import RadioSelect from '..';

describe('RadioSelect', () => {
  test('displays option labels', () => {
    const { getByText } = render(
      <RadioSelect options={['apple', 'orange', 'banana']} value="apple" />,
    );
    expect(getByText('apple')).toBeInTheDocument();
    expect(getByText('orange')).toBeInTheDocument();
    expect(getByText('banana')).toBeInTheDocument();
  });

  test('sets input value as selected', () => {
    const { getByTestId } = render(
      <RadioSelect options={['apple', 'orange', 'banana']} value="apple" />,
    );
    expect(getByTestId('radio-option__apple')).toHaveAttribute('checked');
    expect(getByTestId('radio-option__orange')).not.toHaveAttribute('checked');
    expect(getByTestId('radio-option__banana')).not.toHaveAttribute('checked');
  });

  test('shows captions when given', () => {
    const apple = {
      key: 'apple', value: 'apple', label: 'apple', caption: 'this the most basic fruit',
    };
    const orange = {
      key: 'orange', value: 'orange', label: 'orange', caption: 'contensious, rhymes with nothing',
    };
    const { getByText } = render(
      <RadioSelect options={[apple, orange]} />,
    );
    expect(getByText(apple.label)).toBeInTheDocument();
    expect(getByText(orange.label)).toBeInTheDocument();
    expect(getByText(apple.caption)).toBeInTheDocument();
    expect(getByText(orange.caption)).toBeInTheDocument();
  });
});
