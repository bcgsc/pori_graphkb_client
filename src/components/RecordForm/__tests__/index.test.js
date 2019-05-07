import React from 'react';
import { mount } from 'enzyme';

import SnackbarProvider from '@bcgsc/react-snackbar-provider';

import RecordForm from '..';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';


describe('RecordForm', () => {
  test('Record Form Component Mounts successfully', () => {
    // const mockFn = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <SnackbarProvider>
          <RecordForm
            name="name"
            variant="new"
            modelName="Ontology"
            rid={null}
            title="Add a new Record (Ontology)"
            onSubmit={jest.fn()}
            onDelete={jest.fn()}
          />
        </SnackbarProvider>
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toHaveLength(1);
  });
});
