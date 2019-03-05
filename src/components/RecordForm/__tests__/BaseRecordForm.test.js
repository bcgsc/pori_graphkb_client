import React from 'react';
import { mount } from 'enzyme';

import BaseRecordForm from '../BaseRecordForm';
import Schema from '../../../services/schema';
import { KBContext } from '../../KBContext';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import ActionButton from '../../ActionButton';
import { ApiCall } from '../../../services/api/call';


describe('BaseRecordForm', () => {
  jest.spyOn(ApiCall.prototype, 'request').mockImplementation(async () => []);
  test.todo('populateFromRecord');
  test('edit variant has submit and delete buttons', () => {
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="edit"
          modelName="Disease"
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(ActionButton)).toHaveLength(2);
  });
  test('view variant has no buttons', () => {
    // edit button exist on the parent component and not the base
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="view"
          modelName="Disease"
          value={{ '@class': 'Disease' }}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(ActionButton)).toHaveLength(0);
  });
  test('new variant has a submit button', () => {
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="new"
          modelName="Disease"
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(ActionButton)).toHaveLength(1);
  });
  test('abstract class descendants for select', () => {
    // the class drop down should be a list of all the non-abstract descdent model names
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="new"
          modelName="Variant"
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    // +1 for the unselected/null/"" option
    expect(wrapper.find(ResourceSelectComponent).prop('resources')).toHaveLength(3);
  });
});
