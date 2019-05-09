

import React from 'react';
import { mount } from 'enzyme'; // eslint-disable-line no-use-before-define

import RecordForm from '..';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import ActionButton from '../../ActionButton';
import BaseRecordForm from '../BaseRecordForm'; // eslint-disable-line

jest.mock('api');


// import SnackbarProvider from '@bcgsc/react-snackbar-provider';
describe('RecordForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
    console.log('RESETTING ALL MOCKS');
  });

  test('Record Form Component Mounts successfully', () => {
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

  test.skip('Delete a User successfully', () => {
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
    const spy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
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
    expect(spy.mock.calls.length).toBe(1);
    console.log('[DELSPY MOCK FIELDS]', spy.mock);
  });

  test.skip('adding a new user node', () => {
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
          title="Add a new Record User"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    let errorsCheck = baseRecordFormInstance.state.errors;
    // hacky solution for now until I figure out how this error occurs
    const noManualUserInputErrMsg = 'Required Value';
    console.log('[errorsCheck before manualInput check] ', errorsCheck.name.message);
    if (errorsCheck.name.message === noManualUserInputErrMsg) {
      errorsCheck = {};
    }
    console.log('[errorsCheck after manualInput check] ', errorsCheck);
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: errorsCheck,
    });
    wrapper.update();
    const mockAddUserSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        body: 'ReadableStream',
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
    expect(mockAddUserSpy.mock.calls.length).toBe(1);
    console.log('[ADDSPY MOCK FIELDS]', mockAddUserSpy.mock);
  });

  test('deleting a user successfully', () => {
    // mock function to confirm mock API is working
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
    const delUserSubmit = jest.fn();
    const mockDelSpy = jest.spyOn(api, 'delete');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          variant="edit"
          modelName="User"
          rid="#20:12"
          onTopClick={null}
          onSubmit={delUserSubmit}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.prop('onSubmit')).toEqual(delUserSubmit);
    expect(wrapper.find(RecordForm)).toBeDefined();

    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
    });
    wrapper.update();
    const delBtn = wrapper.find(ActionButton).at(0);
    delBtn.prop('onClick')();
    expect(mockDelSpy).toHaveBeenCalled();
    // expect(delUserSubmit).toHaveBeenCalled();
  });
});
