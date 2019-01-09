import React from 'react';
import { mount } from 'enzyme';
import PermissionsTable from '../PermissionsTable/PermissionsTable';
import Schema from '../../../../services/schema';

const testSchema = new Schema({
  Disease: { name: 'Disease', inherits: ['Ontology'] },
  AliasOf: { name: 'AliasOf', inherits: ['E'] },
  E: { name: 'E' },
  Ontology: { name: 'Ontology', inherits: ['V'] },
});

const testPermissions = {
  Disease: [0, 0, 1, 0],
  AliasOf: [1, 0, 1, 0],
  E: [0, 0, 0, 0],
  Ontology: [0, 0, 1, 1],
};

describe('<PermissionsTable />', () => {
  let wrapper;

  it('correctly renders wrapper table without any rows', () => {
    wrapper = mount(
      <PermissionsTable schema={testSchema} />,
    );
    expect(wrapper.type()).toBe(PermissionsTable);
    expect(wrapper.find('tr.permissions-view')).toHaveLength(0);
  });

  it('renders correct number of rows with an input usergroup', () => {
    wrapper = mount(
      <PermissionsTable
        schema={testSchema}
        permissions={testPermissions}
      />,
    );
    expect(wrapper.find('tr.permissions-view')).toHaveLength(4);
  });

  it('event functions are triggered correctly on checkbox changes', () => {
    const handleChange = jest.fn();
    const handleCheckAll = jest.fn();
    wrapper = mount(
      <PermissionsTable
        schema={testSchema}
        permissions={testPermissions}
        handleChange={handleChange}
        handleCheckAll={handleCheckAll}
      />,
    );
    wrapper.find('thead tr th input[type="checkbox"]').first().simulate('change');
    expect(handleCheckAll.mock.calls.length).toBe(1);

    wrapper.find('tbody tr td input[type="checkbox"]').first().simulate('change');
    expect(handleCheckAll.mock.calls.length).toBe(1);
  });
});
