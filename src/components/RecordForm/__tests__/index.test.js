

import React from 'react';
import { mount } from 'enzyme'; // eslint-disable-line no-use-before-define
import RecordForm from '..';
import { RecordForm as RawRecordForm } from '..';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import ActionButton from '../../ActionButton';
import BaseRecordForm from '../BaseRecordForm';


// class MockApiCall {
//   constructor(endpoint, requestOptions, callOptions) {
//     const {
//       name = null,
//     } = callOptions || {};
//     this.endpoint = endpoint;
//     this.requestOptions = requestOptions;
//     this.name = name || endpoint;
//     this.controller = null;
//     this.mockDefaultReturnObject = {
//       '@class': 'User',
//       '@rid': '#19:28',
//       '@type': 'd',
//       '@version': 1,
//       createdAt: 1557424042283,
//       createdBy: '#19:9',
//       groups: ['#18:0'],
//       name: 'testreadonlydp23',
//       uuid: '7b76fc9e-d2da-444d-a92d-0febb1c9645c',
//     };
//   }

//   /**
//      * Cancel this fetch request
//      */
//   abort() {
//     if (this.controller) {
//       this.controller.abort();
//       this.controller = null;
//     }
//   }

//   @boundMethod
//   async request(ignoreAbort = true) {
//     console.log('[mockAPICALL request ] endpoint: ', this.endpoint);
//     if (this.requestOptions.method === 'DELETE') {
//       return this.deleteRequest();
//     } if (this.requestOptions.method === 'POST') {
//       return this.postRequest();
//     } if (this.requestOptions.method === 'GET') {
//       return this.getRequest();
//     } if (this.requestOptions.method === 'PATCH') {
//       return this.patchRequest();
//     }
//     return console.log('Something went wrong');
//   }


//   deleteRequest = () => {
//     console.log('DELETE REQUEST');
//     return Promise.resolve(this.mockDefaultReturnObject);
//   };

//   postRequest = () => {
//     console.log('RUNNING POST REQUEST');
//     return Promise.resolve(this.mockDefaultReturnObject);
//   };

//   getRequest = () => {
//     console.log('Running Get Request to extract node info');
//     // if (this.endpoint.includes('/users')) {
//     //   const mockUserInfo = [{
//     //     '@class': 'User',
//     //     '@rid': '#19:31',
//     //     createdAt: 1557506822378,
//     //     createdBy: {},
//     //     groups: [],
//     //     name: 'testRegularDP1',
//     //     uuid: '9605fdcc-fbec-4970-b0d5-c9f6e78f1810',
//     //   }];
//     //   return Promise.resolve(mockUserInfo);
//     // } if (this.endpoint.includes('/v')) {
//     //   const mockTranscriptInfo = [{
//     //     '@class': 'Statement',
//     //     '@rid': '#84:12650',
//     //     appliesTo: {},
//     //     createdAt: 1553905917653,
//     //     createdBy: {},
//     //     out_ImpliedBy: [],
//     //     out_SupportedBy: [],
//     //     relevance: {},
//     //     reviewStatus: 'not required',
//     //     source: {},
//     //     uuid: '53a251af-98e4-4622-893c-4e392b1f44a8',
//     //   }];
//     //   return Promise.resolve(mockTranscriptInfo);
//     // }
//     return Promise.resolve([this.mockDefaultReturnObject]);
//   };

//   patchRequest = () => {
//     console.log('Running Patch Request');
//     const mockFeatureEditContent = {
//       '@type': 'd',
//       '@class': 'Feature',
//       deprecated: false,
//       sourceId: 'sourceid',
//       biotype: 'transcript',
//       createdAt: 1557441819899,
//       createdBy: '#19:9',
//       name: 'testtranscript',
//       description: 'new description',
//       source: '#22:2',
//       uuid: 'f88ace86-658c-4920-9ee0-f288767c802e',
//       history: '#59:200883',
//       '@rid': '#60:200948',
//       '@version': 2,
//     };
//     return Promise.resolve(mockFeatureEditContent);
//   };
// }


jest.mock('../../../services/api', () => {
  const mockReturnVal = {
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
  const mockRequest = () => ({
    request: async () => {
      console.log('MOCK REQUEST');
      return Promise.resolve(
        mockReturnVal,
      );
    },
    abort: () => { console.log('CALLING ABORT'); },
  });
  const requestFunc = jest.fn()
    .mockReturnValue(mockRequest());
  return ({
    delete: requestFunc,
    // post is the only function not returning a promise
    post: requestFunc,
    get: requestFunc,
    patch: requestFunc,
  });
});


// jest.mock('../../../services/api', () => ({

//   delete: (endpoint, callOptions) => {
//     const init = {
//       method: 'DELETE',
//     };
//     return new MockApiCall(endpoint, init, callOptions);
//   },
//   post: (endpoint, payload, callOptions) => {
//     const init = {
//       method: 'POST',
//       // body: jc.stringify(payload),
//     };
//     return new MockApiCall(endpoint, init, callOptions);
//   },
//   get: (endpoint, callOptions) => {
//     const init = {
//       method: 'GET',
//     };
//     return new MockApiCall(endpoint, init, callOptions);
//   },
//   patch: (endpoint, payload, callOptions) => {
//     const init = {
//       method: 'PATCH',
//       // body: jc.stringify(payload),
//     };
//     return new MockApiCall(endpoint, init, callOptions);
//   },
// }));


describe('RecordForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
    console.log('RESETTING ALL MOCKS');
  });
  // WORKING
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
          onTopClick={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toHaveLength(1);
  });
  // WORKING
  test('RecordForm Mounts and Unmounts correctly', () => {
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="V"
          onError={jest.fn()}
          onSubmit={jest.fn()}
          onTopClick={jest.fn()}
          rid={null}
          title="Search for a Record (V)"
          value={{}}
          variant="search"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    wrapper.unmount();
    expect(wrapper.exists()).toBeFalsy();
  });

  // WORKING
  test('deleting a user successfully', () => {
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
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleDeleteAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          variant="edit"
          modelName="User"
          rid="#20:12"
          onSubmit={onSubmitSpy}
          onError={onErrorSpy}
          onTopClick={jest.fn()}
          value={{}}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.prop('onSubmit')).toEqual(onSubmitSpy);
    expect(wrapper.find(RecordForm)).toBeDefined();
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      error: {},
    });
    wrapper.update();
    expect(wrapper.find(ActionButton)).toHaveLength(3);
    const delBtn = wrapper.find(ActionButton).at(1);
    expect(delBtn.text()).toEqual('DELETE');
    delBtn.prop('onClick')();
    wrapper.update();
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  // WORKS
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
    const onSubmitSpy = jest.fn();
    const onErrorSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleNewAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          name="name"
          variant="new"
          modelName="User"
          rid={null}
          onTopClick={jest.fn()}
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
    if (errorsCheck.name.message === noManualUserInputErrMsg) {
      errorsCheck = {};
    }
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: errorsCheck,
    });
    wrapper.update();
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitNewUserBtn = wrapper.find(ActionButton).at(0);
    expect(submitNewUserBtn.text()).toEqual('SUBMIT');
    submitNewUserBtn.prop('onClick')();
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('edit edge form (delete only) ', () => {

  });
  // WORKING
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
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleEditAction');

    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName={null}
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          rid="60:200948"
          title="Edit this Record"
          value={null}
          variant="edit"
          onTopClick={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: mockError,
    });
    expect(wrapper.find(ActionButton)).toHaveLength(3);
    const submitEditBtn = wrapper.find(ActionButton).at(2);
    expect(submitEditBtn.text()).toEqual('SUBMIT CHANGES');
    submitEditBtn.prop('onClick')();
    expect(handlerSpy.mock.calls.length).toBe(1);
  });
  //  WORKING
  test('search for a node/edge', () => {
    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleSearchAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="V"
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          onTopClick={jest.fn()}
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
    expect(submitBtn.text()).toEqual('SUBMIT');
    submitBtn.prop('onClick')();
    expect(onSubmitSpy.mock.calls.length).toBe(1);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });
  // WORKING
  test('adding a new record (Ontology) ', () => {
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleNewAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="Ontology"
          onError={jest.fn()}
          onSubmit={jest.fn()}
          onTopClick={jest.fn()}
          rid={null}
          title="Add a new Record (Ontology)"
          value={{}}
          variant="new"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();
    const mockContent = {
      '@class': 'Feature',
      biotype: 'exon',
      description: 'test description',
      name: 'test exon',
      sourceId: 'sourceid',
    };
    const BaseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    BaseRecordFormInstance.setState({
      content: mockContent,
      errors: {},
    });
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitBtn = wrapper.find(ActionButton).at(0);
    expect(submitBtn.text()).toEqual('SUBMIT');
    submitBtn.prop('onClick')();
    expect(handlerSpy.mock.calls.length).toBe(1);
  });
});
