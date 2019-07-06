import React from 'react';
import {
  Table,
  TableRow,
} from '@material-ui/core';
import { mount } from 'enzyme';

import EdgeTable from '../EdgeTable';
import Schema from '../../../services/schema';
import { KBContext } from '../../KBContext';
import DetailChip from '../../DetailChip';


describe('EdgeTable', () => {
  // patch the schema methods to simplify our edge mocks
  jest.spyOn(Schema.prototype, 'getLabel').mockImplementation(
    item => item.key,
  );
  jest.spyOn(Schema.prototype, 'get').mockImplementation(
    () => ({
      name: 'relationshipName',
      reversename: 'reverseRelationshipName',
    }),
  );

  test('Renders multiple edges', () => {
    const edges = [
      { out: { key: 'target1' }, key: 'edge1', '@class': 'E' },
      { in: { key: 'target2' }, key: 'edge2', '@class': 'E' },
    ];
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <EdgeTable
          itemToKey={item => `${item.key}`}
          values={edges}
        />
      </KBContext.Provider>
    ));
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(TableRow)).toHaveLength(3);
    expect(wrapper.find(DetailChip)).toHaveLength(2);
  });

  test('Infers direction based on sourceId', () => {
    const edges = [
      {
        out: { key: 'target1' }, key: 'edge1', in: { key: 'target0' }, '@class': 'E',
      },
      {
        in: { key: 'target2' }, key: 'edge2', out: { key: 'target0' }, '@class': 'E',
      },
    ];
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <EdgeTable
          itemToKey={item => `${item.key}`}
          values={edges}
          sourceNodeId="target0"
        />
      </KBContext.Provider>
    ));
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.find(TableRow)).toHaveLength(3);
    expect(wrapper.find(DetailChip)).toHaveLength(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
