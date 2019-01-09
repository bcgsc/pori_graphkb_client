import React from 'react';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import OntologyFormComponent from '../OntologyFormComponent/OntologyFormComponent';
import Schema from '../../services/schema';

const testSchema = new Schema({
  V: {
    name: 'V',
    properties: [],
  },
  Ontology: {
    name: 'Ontology',
    subclasses: [{ name: 'Disease' }],
  },
  Variant: {
    name: 'Variant',
    subclasses: [],
  },
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
  E: {
    name: 'E',
    subclasses: [{ name: 'edge' }],
  },
});

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
    expect(wrapper.type()).toBe(OntologyFormComponent);
    expect(OntologyFormComponent.prototype.componentDidMount).toHaveProperty('callCount', 1);
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

    expect(OntologyFormComponent.prototype.componentDidMount).toHaveProperty('callCount', 1);
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
    expect(wrapper.find('.embedded-list-chip')).toHaveLength(0);
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
    expect(wrapper.find('.embedded-list-chip svg')).toHaveLength(1);
    wrapper.find('.embedded-list-chip svg').simulate('click');
    expect(wrapper.find('.embedded-list-chip svg')).toHaveLength(1);
    expect(wrapper.find('.deleted-chip svg')).toHaveLength(1);
    wrapper.find('.embedded-list-chip svg').simulate('click');
    expect(wrapper.find('.deleted-chip')).toHaveLength(0);
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
    expect(wrapper.find('button#submit-btn'));
    wrapper.find('nav textarea[name="name"]').simulate('change', { target: { value: 'test', name: 'name' } });
    const { form } = wrapper.state();
    form.linkprop = 'test link';
    form['linkprop.data'] = { '@rid': 'test rid' };
    wrapper.setState({ form });
    expect(wrapper.find('.form-btns button#submit-btn').props().disabled).toBe(false);
    wrapper.find('#submit-btn').first().simulate('click');
    expect(OntologyFormComponent.prototype.handleSubmit).toHaveProperty('callCount', 1);
    expect(handleSubmit.mock.calls.length).toBe(1);

    wrapper.setState({ loading: false });
    wrapper.find('.notification-drawer button').simulate('click');
    expect(handleFinish.mock.calls.length).toBe(1);

    wrapper.setState({ notificationDrawerOpen: false });
  });

  it('delete dialog appears', () => {
    wrapper = mount(
      <OntologyFormComponent
        variant="edit"
        schema={testSchema}
        node={testNode}
        sources={testSources}
        edgeTypes={['AliasOf']}
      />,
    );
    wrapper.find('#delete-btn').first().simulate('click');
    wrapper.setState({ deleteDialog: true });
    expect(wrapper.find('#confirm-delete').length).toBeGreaterThanOrEqual(1);

    wrapper.find('#cancel-delete').first().simulate('click');
    expect(wrapper.state().deleteDialog).toBe(false);
    wrapper.setState({ deleteDialog: true });
    wrapper.find('#confirm-delete').first().simulate('click');
  });
});
