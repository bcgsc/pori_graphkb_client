

import React from 'react';
import { mount } from 'enzyme'; // eslint-disable-line no-use-before-define
import * as jc from 'json-cycle';
import { boundMethod } from 'autobind-decorator';
import RecordForm from '..';
import expect from 'expect';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import ActionButton from '../../ActionButton';
import BaseRecordForm from '../BaseRecordForm'; // eslint-disable-line


class MockApiCall {
  constructor(endpoint, requestOptions, callOptions) {
    const {
      name = null,
    } = callOptions || {};
    this.endpoint = endpoint;
    this.requestOptions = requestOptions;
    this.name = name || endpoint;
    this.mockReturnObject = {
      '@class': 'User',
      '@rid': '#19:28',
      '@type': 'd',
      '@version': 1,
      createdAt: 1557424042283,
      createdBy: '#19:9',
      groups: ['#18:0'],
      name: 'testreadonlydp23',
      uuid: '7b76fc9e-d2da-444d-a92d-0febb1c9645c',
    };
  }

  @boundMethod
  async request(ignoreAbort = true) {
    console.log('[mockAPICALL request ] endpoint: ', this.endpoint);
    if (this.requestOptions.method === 'DELETE') {
      return this.deleteRequest();
    } if (this.requestOptions.method === 'POST') {
      return this.postRequest();
    } if (this.requestOptions.method === 'GET') {
      return this.getRequest();
    } if (this.requestOptions.method === 'PATCH') {
      return this.patchRequest();
    }
    return console.log('Something went wrong');
  }


  deleteRequest = () => {
    console.log('DELETE REQUEST');
    return Promise.resolve(this.mockReturnObject);
  };

  postRequest = () => {
    console.log('RUNNING POST REQUEST');
    return Promise.resolve(this.mockReturnObject);
  };

  getRequest = () => {
    console.log('Running Get Request');
    return Promise.resolve(this.mockReturnObject);
  };

  patchRequest = () => {
    console.log('Running Patch Request');
    const mockFeatureEditContent = {
      '@type': 'd',
      '@class': 'Feature',
      deprecated: false,
      sourceId: 'sourceid',
      biotype: 'transcript',
      createdAt: 1557441819899,
      createdBy: '#19:9',
      name: 'testtranscript',
      description: 'new description',
      source: '#22:2',
      uuid: 'f88ace86-658c-4920-9ee0-f288767c802e',
      history: '#59:200883',
      '@rid': '#60:200948',
      '@version': 2,
    };
    return Promise.resolve(mockFeatureEditContent);
  };
}

// const api = jest.requireActual('../../../services/api');
// api.delete = (endpoint, callOptions) => {
//   const init = {
//     method: 'DELETE',
//   };
//   return new MockApiCall(endpoint, init, callOptions);
// };

// api.post = (endpoint, payload, callOptions) => {
//   const init = {
//     method: 'POST',
//     // body: jc.stringify(payload),
//   };
//   return new MockApiCall(endpoint, init, callOptions);
// };

// api.patch = (endpoint, payload, callOptions) => {
//   const init = {
//     method: 'PATCH',
//     // body: jc.stringify(payload),
//   };
//   return new MockApiCall(endpoint, init, callOptions);
// };

jest.mock('../../../services/api', () => ({

  delete: (endpoint, callOptions) => {
    const init = {
      method: 'DELETE',
    };
    return new MockApiCall(endpoint, init, callOptions);
  },
  post: (endpoint, payload, callOptions) => {
    const init = {
      method: 'POST',
      // body: jc.stringify(payload),
    };
    return new MockApiCall(endpoint, init, callOptions);
  },
  // get: (endpoint, callOptions) => {
  //   const init = {
  //     method: 'GET',
  //   };
  //   return new MockApiCall(endpoint, init, callOptions);
  // },
  patch: (endpoint, payload, callOptions) => {
    const init = {
      method: 'PATCH',
      // body: jc.stringify(payload),
    };
    return new MockApiCall(endpoint, init, callOptions);
  },
}));


// import SnackbarProvider from '@bcgsc/react-snackbar-provider';
describe('RecordForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
    console.log('RESETTING ALL MOCKS');
  });

  test.skip('Record Form Component Mounts successfully', () => {
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
    const onSubmitSpy = jest.fn();
    const onErrorSpy = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          name="name"
          variant="new"
          modelName="User"
          rid={null}
          onTopClick={null}
          onSubmit={onSubmitSpy}
          onError={onErrorSpy}
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
    // mockApi();
    wrapper.update();
    const submitNewUserBtn = wrapper.find(ActionButton).at(0);
    submitNewUserBtn.prop('onClick')();
  });

  test.skip('deleting a user successfully', () => {
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
    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          variant="edit"
          modelName="User"
          rid="#20:12"
          onTopClick={null}
          onSubmit={onSubmitSpy}
          onError={onErrorSpy}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.prop('onSubmit')).toEqual(onSubmitSpy);
    expect(wrapper.find(RecordForm)).toBeDefined();

    // const handleDeleteSpy = jest.spyOn(RecordForm, 'handleDeleteAction');
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      error: {},
    });
    wrapper.update();
    const delBtn = wrapper.find(ActionButton).at(0);
    delBtn.prop('onClick')();
    wrapper.update();
    // these spy functions aren't being arent being called
    // console.log('[handleDeleteAction]', handleDeleteSpy.mock);
    console.log('[ONSUBMITSPY]', onSubmitSpy.mock);
    console.log('[onDeleteSpy]', onErrorSpy.mock);
    expect(onErrorSpy.mock.calls.length).toBe(1);
  });

  test('edit edge form (delete only) ', () => {

  });

  test('editing a  vertex/node form ', () => {
    const mockContent = {
      '@class': 'Feature',
      '@rid': '#60:200948',
      biotype: 'transcript',
      createdAt: 1557439128717,
      deprecated: false,
      name: 'testtranscript',
      sourceId: 'sourceid',
      uuid: 'f88ace86-658c-4920-9ee0-f288767c802e',
      description: 'Brand New Description',
    };
    const mockError = {};
    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName={null}
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          rid="60:200948"
          title="Edit this Record"
          value={{}}
          variant="edit"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    // mockApi();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: mockError,
    });
    expect(wrapper.find(ActionButton)).toHaveLength(2);
    const submitEditBtn = wrapper.find(ActionButton).at(1);
    submitEditBtn.prop('onClick')();
    console.log('[ONSUBMITSPY]', onSubmitSpy.mock);
    console.log('[ONERRORSPY]', onErrorSpy.mock);
  });

  test.skip('search for a node/edge', () => {
    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="V"
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          rid={null}
          title="Search for a Record (V)"
          value={{}}
          variant="search"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const BaseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    BaseRecordFormInstance.setState({
      content: {
        '@class': 'Feature',
        name: 'kras',
      },
    });
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitBtn = wrapper.find(ActionButton).at(0);
    submitBtn.prop('onClick')();
    expect(onSubmitSpy.mock.calls.length).toBe(1);
    console.log('[ONSUBMITSPY]', onSubmitSpy.mock);
    console.log('[ONERRORSPY]', onErrorSpy.mock);
  });
});
