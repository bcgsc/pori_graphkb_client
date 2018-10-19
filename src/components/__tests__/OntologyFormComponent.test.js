import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import OntologyFormComponent from '../OntologyFormComponent/OntologyFormComponent';

const testSchema = {
  Disease: {
    inherits: ['Ontology'],
    properties: [
      { name: 'name', type: 'string', mandatory: true },
      { name: 'sourceId', type: 'string' },
      { name: 'biotype', type: 'string' },
      { name: 'value', type: 'number' },
      { name: 'subsets', type: 'embeddedset' },
      { name: 'linkprop', type: 'link', mandatory: true },
    ],
  },
};

const testSources = [
  { '@rid': '#source', name: 'test source' },
];

const testNode = {
  '@class': 'Disease',
  '@rid': '#1',
  name: 'tset',
  sourceId: 'id number 1',
  biotype: 'gene',
  in_AliasOf: [
    {
      in: {
        '@class': 'Disease',
        '@rid': '#1',
        name: 'tset',
        sourceId: 'id number 1',
        biotype: 'gene',
      },
      out: {
        '@class': 'Disease',
        '@rid': '#2',
        name: 'related tst',
        source: '#source',
      },
      source: '#source',
    },
  ],
};

describe('<OntologyFormComponent />', () => {
  let wrapper;

  beforeAll(() => {
    spy(OntologyFormComponent.prototype, 'handleSubsetAdd');
    spy(OntologyFormComponent.prototype, 'handleFormChange');
    spy(OntologyFormComponent.prototype, 'handleSubmit');
    spy(OntologyFormComponent.prototype, 'componentDidMount');
  });

  it('structure', () => {
    wrapper = mount(
      <OntologyFormComponent schema={testSchema} />,
    );
    expect(wrapper.type()).to.equal(OntologyFormComponent);
  });

  it('onChange simulation', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="add"
        schema={testSchema}
      />,
    );
    wrapper.find('input#subset-temp').simulate('change');
    wrapper.find('input#subset-temp').simulate('keydown', { keyCode: 13 });
    expect(OntologyFormComponent.prototype.handleSubsetAdd).to.have.property('callCount', 1);
    wrapper.find('div.subsets-wrapper button').simulate('click');
    expect(OntologyFormComponent.prototype.handleSubsetAdd).to.have.property('callCount', 2);
    wrapper.find('.param-section nav input').forEach((input, i) => {
      input.simulate('change');
      expect(OntologyFormComponent.prototype.handleFormChange).to.have.property('callCount', i);
    });
  });

  it('with initial node', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="edit"
        schema={testSchema}
        node={testNode}
        sources={testSources}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(OntologyFormComponent.prototype.componentDidMount).to.have.property('callCount', 3);
  });

  it('subset deletion', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="add"
        schema={testSchema}
      />,
    );
    wrapper.setState({ subset: 'test' });
    wrapper.find('input#subset-temp')
      .simulate('keydown', { keyCode: 13 });
    wrapper.find('.subset-chip svg').simulate('click');
    expect(!wrapper.find('.subset-chip'));
  });

  it('subset undo', () => {
    testNode.subsets = ['test'];
    wrapper = mount(
      <OntologyFormComponent
        variant="edit"
        schema={testSchema}
        node={testNode}
        sources={testSources}
        edgeTypes={['AliasOf']}
      />,
    );
    expect(wrapper.find('.subset-chip svg')).to.have.lengthOf(1);
    wrapper.find('.subset-chip svg').simulate('click');
    expect(wrapper.find('.subset-chip svg')).to.have.lengthOf(1);
    expect(wrapper.find('.deleted-chip svg')).to.have.lengthOf(1);
    wrapper.find('.subset-chip svg').simulate('click');
    expect(wrapper.find('.deleted-chip')).to.have.lengthOf(0);
  });

  it('relationships', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="edit"
        schema={testSchema}
        node={testNode}
        sources={testSources}
        edgeTypes={['AliasOf']}
      />,
    );

    wrapper.find('#add-btn-cell button').simulate('click');
    expect(wrapper.find('table.form-table tbody tr')).to.have.lengthOf(2);

    wrapper.find('tr#relationship-add div.search-wrap input')
      .simulate('change', { target: { value: 'test', '@rid': '#9', sourceId: 'testId' } });
    wrapper.find('button[name="direction"]').simulate('click');
    wrapper.find('tr#relationship-add div.search-wrap input')
      .simulate('change', { target: { value: 'test', '@rid': '#9', sourceId: 'testId' } });

    wrapper.find('button[name="direction"]').simulate('click');
    wrapper.find('div#relationship-type input').simulate('change', { target: { value: 'test type' } });
    wrapper.find('div#relationship-source input').simulate('change', { target: { value: 'test source' } });

    wrapper.setState({
      relationship: {
        '@class': 'Test',
        name: 'test relationship',
        sourceId: 'test relationship id',
        in: '#1',
        out: '#23',
        source: '#source',
      },
    });
    wrapper.find('button[name="direction"]').simulate('click');
    wrapper.find('#add-btn-cell button').simulate('click');
    expect(wrapper.find('table.form-table tbody tr')).to.have.lengthOf(3);

    wrapper.find('table.form-table tbody tr td button.delete-btn')
      .first()
      .simulate('click');
    expect(wrapper.find('tr.deleted')).to.have.lengthOf(1);
    wrapper.find('table.form-table tbody tr.deleted td button')
      .first()
      .simulate('click');
    expect(wrapper.find('tr.deleted')).to.have.lengthOf(0);
  });

  it('validation and submission', () => {
    const handleFinish = jest.fn();
    const handleCancel = jest.fn();
    const handleSubmit = jest.fn();
    wrapper = mount(
      <OntologyFormComponent
        variant="add"
        schema={testSchema}
        sources={testSources}
        edgeTypes={['AliasOf']}
        handleFinish={handleFinish}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />,
    );
    expect(wrapper.find('button#submit-btn[disabled]'));
    wrapper.find('nav textarea[name="name"]').simulate('change', { target: { value: 'test', name: 'name' } });
    const { form } = wrapper.state();
    form.linkprop = 'test link';
    form['linkprop.@rid'] = 'test rid';
    wrapper.setState({ form });
    expect(wrapper.find('.form-btns button[type="submit"]').props().disabled).to.eq(false);
    wrapper.find('form').simulate('submit');
    expect(OntologyFormComponent.prototype.handleSubmit).to.have.property('callCount', 1);
    expect(handleSubmit.mock.calls.length).to.eq(1);

    wrapper.setState({ loading: false });
    wrapper.find('.notification-drawer button').simulate('click');
    expect(handleFinish.mock.calls.length).to.eq(1);

    wrapper.setState({ notificationDrawerOpen: false });
    wrapper.find('div.form-cancel-btn button').simulate('click');
    expect(handleCancel.mock.calls.length).to.eq(1);
  });
});
