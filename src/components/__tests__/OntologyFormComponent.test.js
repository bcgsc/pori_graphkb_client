import React from 'react';
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
  const handleSubmitSpy = jest.spyOn(OntologyFormComponent.prototype, 'handleSubmit');
  const componentDidMountSpy = jest.spyOn(OntologyFormComponent.prototype, 'componentDidMount');


  it('does not crash', () => {
    wrapper = mount(
      <OntologyFormComponent schema={testSchema} />,
    );
    expect(wrapper.type()).toBe(OntologyFormComponent);
    expect(componentDidMountSpy).toHaveBeenCalledTimes(1);
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

    expect(componentDidMountSpy).toHaveBeenCalledTimes(1);
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
    wrapper.find('.embedded-list__chip svg').simulate('click');
    expect(wrapper.find('.embedded-list__chip')).toHaveLength(0);
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
    expect(wrapper.find('.embedded-list__chip svg')).toHaveLength(1);
    // delete the current chip
    wrapper.find('.embedded-list__chip svg').simulate('click');
    expect(wrapper.find('.embedded-list__chip--deleted svg')).toHaveLength(1);
    expect(wrapper.find('.embedded-list__chip svg')).toHaveLength(0);
    // restore the current chip
    wrapper.find('.embedded-list__chip--deleted svg').simulate('click');
    expect(wrapper.find('.embedded-list__chip--deleted svg')).toHaveLength(0);
    expect(wrapper.find('.embedded-list__chip svg')).toHaveLength(1);
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
    expect(handleSubmitSpy).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls).toHaveLength(1);

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

  afterEach(() => {
    jest.clearAllMocks();
  });
});
