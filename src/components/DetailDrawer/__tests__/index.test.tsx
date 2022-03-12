import '@testing-library/jest-dom/extend-expect';

import {
  act,
  fireEvent,
  render,
} from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthContext } from '@/components/Auth';

import DetailDrawer from '..';

const ontologyNode = {
  '@class': 'Ontology',
  // 1st long field
  name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
  // 2nd long field
  longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
  displayName: 'testNode',
  sourceId: 'test sourceId',
  conditions: [
    {
      '@class': 'Ontology',
      '@rid': '19:1',
      displayName: 'linkedRecord1',
      sourceId: 'BBC',
    },
    {
      '@class': 'Ontology',
      '@rid': '19:1',
      displayName: 'linkedRecord2',
      sourceId: 'CBC',
    },
  ],
  source: {
    '@class': 'Ontology',
    name: 'test source',
  },
  subsets: ['one', 'two', 'three'],
  '@rid': '#1:0',
  in_AliasOf: [{
    '@class': 'AliasOf',
    '@rid': '#141:2',
    in: {
      '@rid': '#135:0',
    },
    out: {
      '@class': 'AliasOf',
      '@rid': '#136:0',
      source: {
        name: 'test source also',
      },
      name: 'hello',
    },
  }],
};

const statementNode = {
  '@class': 'Statement',
  displayName: 'statementNode',
  sourceId: 'test sourceId',
  conditions: [
    {
      '@class': 'Ontology',
      '@rid': '19:1',
      displayName: 'linkedRecord1',
      sourceId: 'BBC',
    },
    {
      '@class': 'Ontology',
      '@rid': '19:2',
      displayName: 'linkedRecord2',
      sourceId: 'CBC',
    },
  ],
  source: {
    '@class': 'Ontology',
    name: 'test source',
  },
  subsets: ['one', 'two', 'three'],
  '@rid': '#12:0',
};

const ProvideSchema = ({ children = [], schema }) => (  // eslint-disable-line
  <BrowserRouter>
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('DetailDrawer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('empty record value does not cause crash (Drawer closes)', () => {
    try {
      render(<ProvideSchema><DetailDrawer /></ProvideSchema>);
    } catch (err) {
      console.error(err);
    }
  });

  describe('Detail drawer with ontology node', () => {
    let dom;
    const onCloseSpy = jest.fn();

    beforeEach(() => {
      dom = render(
        <ProvideSchema>
          <DetailDrawer
            edge={false}
            node={ontologyNode}
            onClose={onCloseSpy}
          />
        </ProvideSchema>,
      );
    });

    test('renders title correctly', () => {
      const { getByText } = dom;
      expect(getByText('testNode (#1:0)')).toBeInTheDocument();
    });

    test('renders subsets(embeddedsets) correctly', () => {
      const { getByText } = dom;
      ['one', 'two', 'three'].forEach((embeddedSet) => {
        expect(getByText(embeddedSet)).toBeInTheDocument();
      });
    });

    test('long value formatter is called correctly', () => {
      const { getByText, getAllByText } = dom;
      expect(getByText('Long Name')).toBeInTheDocument();
      expect(getAllByText('test node. This is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh')).toHaveLength(2);
    });

    test('metadata tab expands correctly', async () => {
      const { getByText, queryByText } = dom;

      const metadata = ['RID', '#1:0', 'Class', 'Ontology'];
      metadata.forEach((field) => {
        expect(queryByText(field)).toBe(null);
      });

      await act(() => { fireEvent.click(getByText('Metadata')); });
      metadata.forEach((field) => {
        expect(queryByText(field)).toBeInTheDocument();
      });
    });

    test('displays relationships correctly and expands correctly', async () => {
      const {
        getByText, queryByText, queryAllByText,
      } = dom;
      const linkedRecordProps = ['Linked Record', 'RID', '#135:0'];
      linkedRecordProps.forEach((prop) => {
        if (prop === '#135:0') {
          expect(queryAllByText(prop)).toHaveLength(1);
        } else {
          expect(queryByText(prop)).toBe(null);
        }
      });
      expect(getByText('Relationships')).toBeInTheDocument();

      await act(() => { fireEvent.click(getByText('AliasOf')); });
      linkedRecordProps.forEach((prop) => {
        if (prop === '#135:0') {
          expect(queryAllByText(prop)).toHaveLength(2);
        } else {
          expect(queryByText(prop)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Statement class detail drawer', () => {
    let dom;
    const onCloseSpy = jest.fn();

    beforeEach(() => {
      dom = render(
        <ProvideSchema>
          <DetailDrawer
            edge={false}
            node={statementNode}
            onClose={onCloseSpy}
          />
        </ProvideSchema>,
      );
    });

    test('displays title and fields correctly', () => {
      const { getByText } = dom;

      const statementProps = ['Conditions', 'Source ID', 'Source', 'Metadata', 'Relationships'];
      statementProps.forEach((prop) => {
        expect(getByText(prop)).toBeInTheDocument();
      });
    });

    test('handles node property type linkset correctly ', async () => {
      const {
        getByText, queryByText, queryAllByText,
      } = dom;

      const statementProps = ['Conditions', 'Ontology', 'linkedRecord1 (19:1)', 'linkedRecord2 (19:2)'];
      statementProps.forEach((prop) => {
        if (prop === 'Ontology') {
          expect(queryAllByText(prop)).toHaveLength(2);
        } else {
          expect(getByText(prop)).toBeInTheDocument();
        }
      });

      const expandedProps = ['19:1', '19:2', 'BBC', 'CBC'];
      expandedProps.forEach((prop) => {
        expect(queryByText(prop)).toBe(null);
      });

      const linksToBeClicked = ['linkedRecord1 (19:1)', 'linkedRecord2 (19:2)'];
      linksToBeClicked.forEach(async (link) => {
        await act(() => {
          fireEvent.click(getByText(link));
        });
      });

      expandedProps.forEach((prop) => {
        expect(queryByText(prop)).toBeInTheDocument();
      });
    });
  });
});
