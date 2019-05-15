import React from 'react';
import { mount } from 'enzyme';

import RecordForm from '..';
import { RawRecordForm } from '..';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import ActionButton from '../../ActionButton';
import BaseRecordForm from '../BaseRecordForm';


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
    request: () => Promise.resolve(
      mockReturnVal,
    ),
    abort: () => {},
  });
  const requestFunc = jest.fn()
    .mockReturnValue(mockRequest());
  return ({
    delete: requestFunc,
    post: requestFunc,
    get: requestFunc,
    patch: requestFunc,
  });
});

describe('RecordForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
          onTopClick={jest.fn()}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toHaveLength(1);
  });

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

  test('delete a user successfully via RecordForm', () => {
    const onErrorSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleDeleteAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          variant="edit"
          modelName="User"
          rid="#20:12"
          onSubmit={jest.fn()}
          onError={onErrorSpy}
          onTopClick={jest.fn()}
          value={{}}
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();

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

    expect(onErrorSpy.mock.calls.length).toBe(0);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('adding a new user node', () => {
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
          onSubmit={jest.fn()}
          onError={onErrorSpy}
          title="Add a new Record User"
        />
      </KBContext.Provider>
    ));
    wrapper.update();
    expect(wrapper.find(RecordForm)).toBeDefined();

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
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: {},
    });
    wrapper.update();

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitNewUserBtn = wrapper.find(ActionButton).at(0);
    expect(submitNewUserBtn.text()).toEqual('SUBMIT');
    submitNewUserBtn.prop('onClick')();

    expect(onErrorSpy.mock.calls.length).toBe(0);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('editing a  vertex/node form ', () => {
    const onErrorSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleEditAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName={null}
          onError={onErrorSpy}
          onSubmit={jest.fn()}
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
    const baseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    baseRecordFormInstance.setState({
      content: mockContent,
      errors: {},
    });

    expect(wrapper.find(ActionButton)).toHaveLength(3);
    const submitEditBtn = wrapper.find(ActionButton).at(2);
    expect(submitEditBtn.text()).toEqual('SUBMIT CHANGES');
    submitEditBtn.prop('onClick')();

    expect(onErrorSpy.mock.calls.length).toBe(0);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('search for a node/edge', () => {
    const onErrorSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleSearchAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="V"
          onError={onErrorSpy}
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

    expect(onErrorSpy.mock.calls.length).toBe(0);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('adding a new record (Ontology) ', () => {
    const onErrorSpy = jest.fn();
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleNewAction');
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="Ontology"
          onError={onErrorSpy}
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

    expect(onErrorSpy.mock.calls.length).toBe(0);
    expect(handlerSpy.mock.calls.length).toBe(1);
  });

  test('RecordForm correctly catches no input errors', () => {
    const handlerSpy = jest.spyOn(RawRecordForm.prototype, 'handleNewAction');
    const onSubmitSpy = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <RecordForm
          modelName="Ontology"
          onError={jest.fn()}
          onSubmit={onSubmitSpy}
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
    };
    const BaseRecordFormInstance = wrapper.find(BaseRecordForm).instance();
    BaseRecordFormInstance.setState({
      content: mockContent,
    });
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitBtn = wrapper.find(ActionButton).at(0);
    expect(submitBtn.text()).toEqual('SUBMIT');
    submitBtn.prop('onClick')();

    expect(BaseRecordFormInstance.state.errors.source.message).toEqual('Required Value');
    expect(BaseRecordFormInstance.state.errors.sourceId.message).toEqual('Required Value');
    expect(handlerSpy.mock.calls.length).toBe(1);
    expect(onSubmitSpy.mock.calls.length).toBe(0);
  });
});
