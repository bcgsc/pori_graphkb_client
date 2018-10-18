import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import PermissionsTable from './PermissionsTable';

const testSchema = {
  Disease: { inherits: ['Ontology'] },
  AliasOf: { inherits: ['E'] },
  E: {},
  Ontology: { inherits: ['V'] },
};

const testUserGroup = {
  permissions: {
    Disease: [0, 0, 1, 0],
    AliasOf: [1, 0, 1, 0],
    E: [0, 0, 0, 0],
    Ontology: [0, 0, 1, 1],
  },
};

describe('<PermissionsTable />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = mount(
      <PermissionsTable schema={testSchema} />,
    );
    expect(wrapper.type()).to.equal(PermissionsTable);
    expect(wrapper.find('tr.permissions-view')).to.have.lengthOf(0);
  });

  it('with usergroup', () => {
    wrapper = mount(
      <PermissionsTable
        schema={testSchema}
        userGroup={testUserGroup}
      />,
    );
    expect(wrapper.find('tr.permissions-view')).to.have.lengthOf(4);
  });
  it('event functions', () => {
    const handleChange = jest.fn();
    const handleCheckAll = jest.fn();
    wrapper = mount(
      <PermissionsTable
        schema={testSchema}
        userGroup={testUserGroup}
        handleChange={handleChange}
        handleCheckAll={handleCheckAll}
      />,
    );
    wrapper.find('thead tr th input[type="checkbox"]').first().simulate('change');
    expect(handleCheckAll.mock.calls.length).to.eq(1);

    wrapper.find('tbody tr td input[type="checkbox"]').first().simulate('change');
    expect(handleCheckAll.mock.calls.length).to.eq(1);
  });
});