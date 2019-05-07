import React from 'react';
import { mount } from 'enzyme';

// import SnackbarProvider from '@bcgsc/react-snackbar-provider';

import RecordForm from '..';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import ActionButton from '../../ActionButton';
import BaseRecordForm from '../BaseRecordForm';
// import ApiCall from '../../../services/api/call';

const ApiCall = require('../../../services/api/call');


describe('RecordForm', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  test('Record Form Component Mounts successfully', () => {
    // const mockFn = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          name="name"
          variant="new"
          modelName="Ontology"
          rid={null}
          title="Add a new Record (Ontology)"
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toHaveLength(1);
  });

  test('Delete a User successfully', () => {
    const mockContent = {
      '@rid': '#20:12',
      '@class': 'User',
      name: 'testreadonlydp2',
      uuid: 'acb7add4-2b70-40ce-bd4b-1a319b615227',
      createdAt: 1557247449003,
      createdBy: {},
      groups: [{
        '@type': 'd',
        '@rid': '#18:0',
        '@version': 1,
        '@class': 'UserGroup',
        name: 'readonly',
        createdAt: 1551989986056,
      }],
    };
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          variant="edit"
          modelName="User"
          rid="#20:12"
          onTopClick={null}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    expect(wrapper.find(ActionButton)).toHaveLength(2);
    expect(wrapper.find(BaseRecordForm)).toBeDefined();

    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
    });
    const spy = jest.spyOn(global, 'fetch').mockReturnValueOnce({
      body: null,
      bodyUsed: true,
      headers: {},
      ok: true,
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'cors',
      url: 'http://kbapi01:8081/api/users/19:15?neighbors=3',
    });

    wrapper.update();
    const delBtn = wrapper.find(ActionButton).at(0);
    delBtn.prop('onClick')();
    expect(spy).toHaveBeenCalled();
  });

  test('adding a new user node', () => {
    const mockContent = {
      '@class': 'User',
      name: 'testRegularDP1',
      groups: [{
        '@class': 'UserGroup',
        '@rid': '#17.1',
        createdAt: 1551989986056,
        name: 'regular',
      }],
    };
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          name="name"
          variant="new"
          modelName="User"
          rid={null}
          onTopClick={null}
          onSubmit={jest.fn()}
          onError={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
    });
    wrapper.update();
    const mockAddSpy = jest.spyOn(global, 'fetch').mockReturnValueOnce({
      body: null,
      bodyUsed: true,
      headers: {},
      ok: true,
      redirected: false,
      status: 201,
      statusText: 'Created',
      type: 'cors',
      url: 'http://kbapi01:8081/api/users',
    });
    wrapper.update();
    const submitNewUserBtn = wrapper.find(ActionButton).at(0);
    submitNewUserBtn.prop('onClick')();
    expect(mockAddSpy).toHaveBeenCalled();
  });
});
