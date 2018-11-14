import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import OntologyFormComponent from '../OntologyFormComponent/OntologyFormComponent';
import Schema from '../../models/schema';
import classes from '../../models/classes';

const testSchema = new Schema({
  Disease: {
    name: 'Disease',
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
  edge: {
    name: 'edge',
    inherits: ['E'],
  },
});

const testSources = [
  { '@rid': '#source', name: 'test source' },
];

const testNode = new classes.Ontology({
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
}, testSchema);

describe('<OntologyFormComponent />', () => {
  let wrapper;

  beforeAll(() => {
    spy(OntologyFormComponent.prototype, 'handleFormChange');
    spy(OntologyFormComponent.prototype, 'handleSubmit');
    spy(OntologyFormComponent.prototype, 'componentDidMount');
  });

  beforeEach(() => {
    OntologyFormComponent.prototype.componentDidMount.callCount = 0;
  });

  it('does not crash', () => {
    wrapper = mount(
      <OntologyFormComponent schema={testSchema} />,
    );
    expect(wrapper.type()).to.equal(OntologyFormComponent);
    expect(OntologyFormComponent.prototype.componentDidMount).to.have.property('callCount', 1);
    OntologyFormComponent.prototype.componentDidMount.callCount = 0;
  });

  it('does not crash in edit variant with node, calls componentDidMount', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="edit"
        schema={testSchema}
        node={testNode}
        sources={testSources}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(OntologyFormComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });

  it('subset deletion successfully removes chip', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="add"
        schema={testSchema}
      />,
    );
    wrapper.find('input#subsets-temp').simulate('change', { target: { name: 'subsets', value: 'hello' } });
    wrapper.find('input#subsets-temp')
      .simulate('keydown', { keyCode: 13 });
    wrapper.find('.embedded-list-chip svg').simulate('click');
    expect(wrapper.find('.embedded-list-chip')).to.have.lengthOf(0);
  });

  it('displays right chips + classes after subset delete undo', () => {
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
    expect(wrapper.find('.embedded-list-chip svg')).to.have.lengthOf(1);
    wrapper.find('.embedded-list-chip svg').simulate('click');
    expect(wrapper.find('.embedded-list-chip svg')).to.have.lengthOf(1);
    expect(wrapper.find('.deleted-chip svg')).to.have.lengthOf(1);
    wrapper.find('.embedded-list-chip svg').simulate('click');
    expect(wrapper.find('.deleted-chip')).to.have.lengthOf(0);
  });

  it('validation and submission calls correct handlers', () => {
    const handleFinish = jest.fn();
    const handleSubmit = jest.fn();
    wrapper = mount(
      <OntologyFormComponent
        variant="add"
        schema={testSchema}
        sources={testSources}
        edgeTypes={['AliasOf']}
        handleFinish={handleFinish}
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
    wrapper.find('#submit-btn').first().simulate('click');
    expect(OntologyFormComponent.prototype.handleSubmit).to.have.property('callCount', 1);
    expect(handleSubmit.mock.calls.length).to.eq(1);

    wrapper.setState({ loading: false });
    wrapper.find('.notification-drawer button').simulate('click');
    expect(handleFinish.mock.calls.length).to.eq(1);

    wrapper.setState({ notificationDrawerOpen: false });
  });
});
