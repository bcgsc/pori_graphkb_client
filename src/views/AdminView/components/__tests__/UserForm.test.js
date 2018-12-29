import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import UserForm from '../UserForm/UserForm';


const testUsers = [
  {
    '@class': 'User',
    name: 'test user 1',
    '@rid': '#testuser1',
    groups: [
      { '@rid': '#8', name: 'test usergroup', permissions: {} },
      { '@rid': '#4', name: 'test usergroup 2', permissions: {} },
    ],
  },
  {
    '@class': 'User',
    name: 'test user 2',
    '@rid': '#testuser2',
    groups: [
      { '@rid': '#8', name: 'test usergroup', permissions: {} },
    ],
  },
  {
    '@class': 'User',
    name: 'test user 3',
    '@rid': '#testuser3',
    groups: [
      { '@rid': '#64', name: 'test usergroup 3', permissions: {} },
    ],
  },
];

let deleteUsers;
let addUser;
let editUser;

describe('<UserForm />', () => {
  const wrapper = mount(
    <UserForm
      deleteUsers={deleteUsers}
      addUser={addUser}
      editUser={editUser}
      users={testUsers}
    />,
  );

  beforeEach(() => {
    deleteUsers = jest.fn();
    addUser = jest.fn();
    editUser = jest.fn();
    wrapper.unmount();
    wrapper.mount();
    wrapper.setProps({
      deleteUsers,
      addUser,
      editUser,
      users: testUsers,
    });
    wrapper.update();
  });

  it('correctly renders wrapper table without any rows', () => {
    wrapper.setProps({ users: undefined });
    expect(wrapper.type()).to.equal(UserForm);
    expect(wrapper.find('tbody tr')).to.have.lengthOf(0);
  });

  it('renders rows for each user', () => {
    expect(wrapper.find('tbody tr')).to.have.lengthOf(3);
  });

  it('opens user dialog', () => {
    expect(wrapper.find('.new-user-dialog-content')).to.have.lengthOf(0);
    wrapper.instance().handleUserDialog();
    wrapper.update();
    expect(wrapper.find('.new-user-dialog-content')).to.have.lengthOf(1);
  });

  it('opens delete user dialog', () => {
    wrapper.instance().handleCheckAllUsers();
    wrapper.instance().handleDeleteDialog();
    wrapper.update();
    expect(wrapper.find('div.admin-section-heading-btns button').first().props().disabled).to.eq(false);
    wrapper.find('div.admin-section-heading-btns button').first().simulate('click');
    expect(wrapper.find('.delete-dialog')).to.have.length.gt(1);
  });

  it('handles single user checkboxes', () => {
    wrapper.find('tbody tr td input[type="checkbox"]').first().simulate('change');
    expect(wrapper.state().selected.length).to.eq(1);
    wrapper.find('tbody tr td input[type="checkbox"]').first().simulate('change');
    expect(wrapper.state().selected.length).to.eq(0);
  });

  it('opens edit dialog', () => {
    wrapper.find('tbody tr td button').first().simulate('click');
    expect(wrapper.find('.new-user-dialog-content')).to.have.lengthOf(1);
  });

  describe('calls prop methods', () => {
    it('addUser', () => {
      wrapper.instance().handleUserAdd();
      expect(addUser.mock.calls.length).to.eq(0);
      wrapper.setState({ newUserName: 'test' });
      wrapper.instance().handleUserAdd();
      expect(addUser.mock.calls.length).to.eq(1);
    });

    it('editUser', () => {
      wrapper.setState({ selectedUser: { name: 'blarghy', '@rid': '#8779' } });
      wrapper.instance().handleUserEdit();
      expect(editUser.mock.calls.length).to.eq(0);
      wrapper.setState({ newUserName: 'blargh' });
      wrapper.instance().handleUserEdit();
      expect(editUser.mock.calls.length).to.eq(1);
    });

    it('deleteUsers', () => {
      wrapper.instance().handleUsersDelete();
      expect(deleteUsers.mock.calls.length).to.eq(1);
    });
  });

  it('manages userGroups state correctly', () => {
    wrapper.instance().handleNewUserGroup({ '@rid': 'new usergroup' });
    wrapper.update();
    expect(wrapper.state().newUserGroups.length).to.eq(1);
    wrapper.instance().handleNewUserGroup({ '@rid': 'new usergroup' });
    wrapper.update();
    expect(wrapper.state().newUserGroups.length).to.eq(0);
  });

  it('handles userDialog state changing', () => {
    wrapper.setState({ userDialogOpen: true });
    wrapper.instance().handleUserDialog();
    wrapper.update();

    wrapper.instance().handleUserDialog();
    wrapper.update();
  });

  it('unmounts without crashing', () => {
    wrapper.unmount();
  });
});
