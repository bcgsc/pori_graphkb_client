import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { TextField } from '@material-ui/core';
import Downshift from 'downshift';
import AutoSearchMulti from '../AutoSearchMulti/AutoSearchMulti';
import AutoSearchBase from '../AutoSearchBase/AutoSearchBase';
import Schema from '../../services/schema';

const testSchema = new Schema({
  V: {
    name: 'V',
    properties: {},
  },
  Ontology: {
    name: 'Ontology',
    subclasses: [],
  },
  Variant: {
    name: 'Variant',
    subclasses: [],
  },
  Disease: {
    name: 'Disease',
    inherits: ['Ontology'],
    queryProperties: [
      { name: '@rid', type: 'string', mandatory: true },
      { name: 'name', type: 'string', mandatory: true },
      { name: 'sourceId', type: 'string' },
      { name: 'biotype', type: 'string' },
      { name: 'value', type: 'number' },
      { name: 'subsets', type: 'embeddedset' },
      { name: 'linkprop', type: 'link', mandatory: true },
    ],
  },
  edge: {
    name: 'edge',
    inherits: ['E'],
  },
});

describe('<AutoSearchMulti />', () => {
  let wrapper;

  it('should correctly render a Downshift component, with nested div and a TextField', () => {
    wrapper = mount(<AutoSearchMulti schema={testSchema} />);
    expect(wrapper.children().first().type()).to.equal(AutoSearchBase);
    expect(wrapper.children().children().first().type()).to.equal(Downshift);
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });

  it('displays popper', () => {
    wrapper = mount(<AutoSearchMulti schema={testSchema} />);
    wrapper.find('.popover-open-btn').first().simulate('click');

    wrapper.instance().handleClassChange({ target: { value: 'Disease' } });
    wrapper.update();
    expect(wrapper.find('.autosearch-multi-popover textarea[name="@rid"]')).to.have.lengthOf(1);
    wrapper.find('.autosearch-multi-popover textarea[name="@rid"]')
      .simulate('change', { target: { name: '@rid', value: '#1' } });
    expect(wrapper.find('.autosearch-multi-popover textarea[name="name"]').props().disabled).to.eq(true);
  });

  it('displays options', () => {
    wrapper = mount((
      <AutoSearchMulti
        schema={testSchema}
        options={['#1', '#2', '#3']}
      />
    ));
    wrapper.find('input').simulate('change');
  });
});
