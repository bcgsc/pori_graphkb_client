import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import UserGroupForm from '../UserGroupForm/UserGroupForm';
import Schema from '../../services/schema';

const testUserGroups = [
  { '@rid': '#8', name: 'test usergroup', permissions: { Ontology: [0, 0, 0, 1] } },
  { '@rid': '#4', name: 'test usergroup 2', permissions: {} },
  { '@rid': '#64', name: 'test usergroup 3', permissions: {} },
];

const testSchema = new Schema({
  Ontology: {
    subclasses: [],
  },
  Variant: {
    subclasses: [],
    isAbstract: true,
  },
  V: {
    properties: [],
  },
  AliasOf: {
    properties: [],
    isEdge: true,
  },
});

let onDelete;
let onAdd;
let onEdit;

describe('<UserGroupForm />', () => {
  let wrapper;

  beforeEach(() => {
    onDelete = jest.fn();
    onAdd = jest.fn();
    onEdit = jest.fn();

    wrapper = mount(
      <UserGroupForm
        userGroups={testUserGroups}
        schema={testSchema}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
  });

  it('correctly renders wrapper table without any rows', () => {
    expect(wrapper.type()).to.equal(UserGroupForm);
  });

  it('stages usergroup for editing', () => {
    wrapper.setState({ expanded: ['#8'] });
    wrapper.find('.user-group-toolbar button').first().simulate('click');
    expect(wrapper.state().tempUserGroup).to.not.eq(null);

    wrapper.find('.user-group-toolbar button#edit-btn').first().simulate('click');
    wrapper.instance().handleUserGroupEdit();
    wrapper.update();
    expect(onEdit.mock.calls.length).to.eq(2);

    wrapper.setState({ expanded: ['#8'] });
    wrapper.find('.user-group-toolbar button#cancel-btn').first().simulate('click');
    expect(wrapper.state().tempUserGroup).to.eq(null);
  });

  it('toggles usergroup dialog', () => {
    wrapper.find('div.admin-section-heading-btns button').simulate('click');
    expect(wrapper.state().newUserGroupDialog).to.eq(true);
    wrapper.instance().handleUserGroupDialog();
    wrapper.update();
    expect(wrapper.state().newUserGroupDialog).to.eq(false);
  });

  it('toggles delete usergroup dialog', () => {
    wrapper.instance().handleDeleteDialog({ test: 'test' });
    wrapper.update();
    expect(wrapper.state().deletedUserGroup).to.eql({ test: 'test' });
  });

  it('submits payload to be sent to server', () => {
    wrapper.setState({ tempUserGroupName: '' });
    wrapper.instance().handleUserGroupSubmit();
    wrapper.update();
    expect(onAdd.mock.calls.length).to.eq(0);

    wrapper.setState({ tempUserGroupName: 'blargh' });
    wrapper.instance().handleUserGroupSubmit();
    wrapper.update();
    expect(onAdd.mock.calls.length).to.eq(1);
  });

  it('handles expansionpanels', () => {
    wrapper.find('.admin-user-groups div[role="button"]')
      .first()
      .simulate('click');
    expect(wrapper.state().expanded.length).to.eq(1);

    wrapper.setState({ tempUserGroup: testUserGroups[0] });
    wrapper.instance().handleUserGroupExpand(testUserGroups[0]['@rid']);
    wrapper.update();
    expect(wrapper.state().expanded.length).to.eq(0);
  });

  it('handles temp group permissions changes', () => {
    wrapper.setState({ tempUserGroupPermissions: { Ontology: [0, 0, 0, 1] } });
    wrapper.instance().handlePermissionsCheckAll({ target: { checked: true } }, 0);
    wrapper.update();
    expect(wrapper.state().tempUserGroupPermissions).to.eql({ Ontology: [1, 0, 0, 1] });

    wrapper.instance().handlePermissionsChange('Ontology', 1, false);
    expect(wrapper.state().tempUserGroupPermissions).to.eql({ Ontology: [1, 1, 0, 1] });
  });

  it('calls onDelete method', () => {
    wrapper.instance().handleUserGroupDelete({ '@rid': 'test' });
    expect(onDelete.mock.calls.length).to.eq(1);
  });
});
