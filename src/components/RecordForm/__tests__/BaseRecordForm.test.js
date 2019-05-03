import React from 'react';
import { mount } from 'enzyme';

import BaseRecordForm from '../BaseRecordForm';
import Schema from '../../../services/schema';
import { KBContext } from '../../KBContext';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import ActionButton from '../../ActionButton';
import { ApiCall } from '../../../services/api/call';


const updateStateAndClickFirstBtn = (wrapper) =>{
  wrapper.update();
  const firstBtn = wrapper.find(ActionButton).at(0);
  firstBtn.prop('onClick')();
}

const updateStateAndClickSecondBtn = (wrapper) =>{
  wrapper.update();
  const secondBtn = wrapper.find(ActionButton).at(1);
  secondBtn.prop('onClick')();
}

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
  test('editable vertex/node form', ()=>{
    const mockEditSubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          rid="63:0"
          name="name"
          variant="edit"
          modelName="Disease"
          onSubmit={mockEditSubmit}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    expect(wrapper.find(ActionButton)).toHaveLength(2);
    //Edit Btn is the second Btn on the RecordForm Component
    updateStateAndClickSecondBtn(wrapper);
    expect(mockEditSubmit.mock.calls.length).toBe(1);
  });
  test('deleting a vertex/node form from edit variance', ()=>{
    const mockDelSubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          rid="63:0"
          name="name"
          variant="edit"
          modelName="Disease"
          onSubmit={jest.fn()}
          onDelete={mockDelSubmit}
        />
      </KBContext.Provider>
    ));
    
    expect(wrapper.find(ActionButton)).toHaveLength(2);
    //Delete Btn is the first Btn that appears on the BaseForm Component
    updateStateAndClickFirstBtn(wrapper);
    expect(mockDelSubmit.mock.calls.length).toBe(1);
  });
  test('adding an ontology node', ()=>{
    const mockAddSubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="new"
          modelName="Ontology"
          onSubmit={mockAddSubmit}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    wrapper.setState({
      '@class': "Evidence", 
      description: "testDescription",
      name: "EvidenceTest",
      source:{
        '@class': "Source",
        name: "bcgsc"
      },
      sourceId: "sourceID"
    }, () => {updateStateAndClickFirstBtn(wrapper)});
    expect(mockAddSubmit.mock.calls.length).toBe(1);
  });
  test('search for biological feature test - kras', ()=>{
    const mockQrySubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          name="name"
          variant="search"
          modelName="V"
          onSubmit={mockQrySubmit}
        />
      </KBContext.Provider>
    ));

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    //test expandOptionsHandler
    const instance = wrapper.instance()
    instance.handleExpand();
    //add in query parameters and submit 
    wrapper.setState({
      '@class': "Feature",
      description: "kras",
    }, ()=> {updateStateAndClickFirstBtn(wrapper)})

    expect(mockQrySubmit.mock.calls.length).toBe(1);
  });
  test('adding a new user', ()=>{
    const mockAddUserSubmit = jest.fn()
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          rid={null}
          modelName="User"
          variant="new"
          name="name"
          onSubmit={mockAddUserSubmit}
          isEmbedded={false}
        />
      </KBContext.Provider>
    ));

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    //add in new user parameters 
    wrapper.setState({
      '@class': "User",
      name:"testUserReadOnly",
      groups: [
        {
          '@class': 'UserGroup',
          '@rid': "#20:20",
          createdAt: 155198998948,
          name:"readonly",
          permissions:{
            '@class': "Permissions"
          }
        }
      ]
    }, ()=> {updateStateAndClickFirstBtn(wrapper)});

    expect(mockAddUserSubmit.mock.calls.length).toBe(1);
  });
  test('edit edge form(delete only)', ()=>{
    const mockDelUserSubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          rid='#20:9'
          modelName="User"
          variant="edit"
          name="name"
          onSubmit={jest.fn()}
          onDelete={mockDelUserSubmit}
        />
      </KBContext.Provider>
    ));

    expect(wrapper.find(ActionButton)).toHaveLength(2);
    //delete is the first Action Button in the Component
    updateStateAndClickFirstBtn(wrapper);
    expect(mockDelUserSubmit.mock.calls.length).toBe(1);
  });
  test('add variant - statement model has a submit button ', ()=>{
    const mockNewStatementSubmit = jest.fn();
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          modelName="Statement"
          variant="new"
          name="name"
          onSubmit={mockNewStatementSubmit}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));

    expect(wrapper.find(ActionButton)).toHaveLength(1);
  });
  test('switching between different RecordForm Models (Ontology-> Variant)', ()=>{
    const wrapper = mount((
      <KBContext.Provider value={{ schema: new Schema() }}>
        <BaseRecordForm
          modelName="Ontology"
          variant="new"
          name="name"
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />
      </KBContext.Provider>
    ));
    console.log(wrapper.props().modelName);
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    wrapper.setProps({
      modelName: 'Variant'
    }, ()=>{wrapper.update()});
    
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    // expect(wrapper.props().modelName).toEqual('Variant');

  });
});



