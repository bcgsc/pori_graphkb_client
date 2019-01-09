import React from 'react';
import { mount } from 'enzyme';
import UserDialog from '../UserForm/UserDialog';


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

const userGroups = [
  { '@rid': '#4', name: 'test usergroup 2', permissions: {} },
];

let onClose;
let addUser;
let editUser;
let onChange;
let onUserGroup;

describe('<UserDialog />', () => {
  let wrapper;

  beforeEach(() => {
    onClose = jest.fn();
    addUser = jest.fn();
    editUser = jest.fn();
    onChange = jest.fn();
    onUserGroup = jest.fn();

    wrapper = mount(
      <UserDialog
        open
        onClose={onClose}
        addUser={addUser}
        editUser={editUser}
        onChange={onChange}
        onUserGroup={onUserGroup}
        users={testUsers}
        userGroups={userGroups}
        selected={[]}
        selectedUser={testUsers[0]}
        newUserGroups={testUsers[0].groups}
        newUserName="blarghy blargh"
      />,
    );
  });

  it('renders without crashing', () => {
    expect(wrapper.type()).toBe(UserDialog);
  });

  it('correctly handles events', () => {
    wrapper
      .find('.new-user-group-checkboxes input[type="checkbox"]')
      .first()
      .simulate('change');
    expect(onUserGroup.mock.calls.length).toBe(1);
    wrapper.find('button#user-dialog-submit-btn').first().simulate('click');
    expect(editUser.mock.calls.length).toBe(1);
  });
});
