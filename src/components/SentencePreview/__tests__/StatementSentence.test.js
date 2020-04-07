import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import StatementSentence from '../StatementSentence';


describe('StatementSentence', () => {
  test('placeholders used when no content given', () => {
    const { getByText } = render(
      <StatementSentence />,
    );
    expect(getByText(/\{conditions\}/)).toBeInTheDocument();
    expect(getByText(/\{relevance\}/)).toBeInTheDocument();
    expect(getByText(/\{subject\}/)).toBeInTheDocument();
    expect(getByText(/\{evidence\}/)).toBeInTheDocument();
  });

  test('partial content ok', () => {
    const { getByText } = render(
      <StatementSentence
        content={{
          conditions: [
            { displayName: 'condition1', '@class': 'Variant' },
            { displayName: 'condition2', '@class': 'Disease' },
          ],
        }}
      />,
    );
    expect(getByText('condition1')).toBeInTheDocument();
    expect(getByText('condition2')).toBeInTheDocument();
    expect(getByText(/\{relevance\}/)).toBeInTheDocument();
    expect(getByText(/\{subject\}/)).toBeInTheDocument();
    expect(getByText(/\{evidence\}/)).toBeInTheDocument();
  });

  test('replaces all fields when given', () => {
    const { getByText } = render(
      <StatementSentence
        content={{
          conditions: [{ displayName: 'KRAS mutation', '@class': 'CategoryVariant', '@rid': '1' }],
          subject: { displayName: 'drugName', '@class': 'Therapy' },
          evidence: [{ displayName: 'PMID:1234', '@class': 'Evidence' }],
          relevance: { displayName: 'sensitivity', '@class': 'Vocabulary' },
        }}
      />,
    );
    expect(getByText('KRAS mutation')).toBeInTheDocument();
    expect(getByText('sensitivity')).toBeInTheDocument();
    expect(getByText('drugName')).toBeInTheDocument();
    expect(getByText('PMID:1234')).toBeInTheDocument();
  });
});
