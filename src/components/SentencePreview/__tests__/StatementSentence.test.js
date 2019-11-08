import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';

import StatementSentence from '../StatementSentence';


describe('StatementSentence', () => {
  test('placeholders used when no content given', () => {
    const { getByText } = render(
      <StatementSentence />,
    );
    expect(getByText(/\[conditions\]/)).toBeInTheDocument();
    expect(getByText(/\[relevance\]/)).toBeInTheDocument();
    expect(getByText(/\[subject\]/)).toBeInTheDocument();
    expect(getByText(/\[evidence\]/)).toBeInTheDocument();
  });

  test('partial content ok', () => {
    const { getByText } = render(
      <StatementSentence
        content={{
          conditions: [{ displayName: 'condition1' }, { displayName: 'condition2' }],
        }}
      />,
    );
    expect(getByText('condition1')).toBeInTheDocument();
    expect(getByText('condition2')).toBeInTheDocument();
    expect(getByText(/\[relevance\]/)).toBeInTheDocument();
    expect(getByText(/\[subject\]/)).toBeInTheDocument();
    expect(getByText(/\[evidence\]/)).toBeInTheDocument();
  });

  test('replaces all fields when given', () => {
    const { getByText } = render(
      <StatementSentence
        content={{
          conditions: [{ displayName: 'KRAS mutation' }],
          subject: { displayName: 'drugName' },
          evidence: [{ displayName: 'PMID:1234' }],
          relevance: { displayName: 'sensitivity' },
        }}
      />,
    );
    expect(getByText('KRAS')).toBeInTheDocument();
    expect(getByText('mutation')).toBeInTheDocument();
    expect(getByText('sensitivity')).toBeInTheDocument();
    expect(getByText('drugName')).toBeInTheDocument();
    expect(getByText('PMID:1234')).toBeInTheDocument();
  });
});
