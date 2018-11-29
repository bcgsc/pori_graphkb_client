import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { spy } from 'sinon';
import { Drawer } from '@material-ui/core';
import DetailDrawer from '../DetailDrawer/DetailDrawer';
import Schema from '../../services/schema';

const testSchema = new Schema({
  test: {
    name: 'test',
    properties: {
      dependency: { name: 'dependency', type: 'link' },
      '@rid': { name: '@rid', type: 'string' },
    },
    identifiers: ['@rid'],
    getPreview: () => 'test',
  },
  E: {
    properties: {},
    subclasses: [
      { name: 'AliasOf' },
    ],
  },
  AliasOf: {
    name: 'AliasOf',
    inherits: ['E'],
    identifiers: ['@rid'],
    properties: {},
    getPreview: () => 'aliasof',
  },
  V: {
    name: 'V',
    properties: {},
  },
  Ontology: {
    name: 'Ontology',
    properties: {
      name: { name: 'name', type: 'string' },
      sourceId: { name: 'sourceId', type: 'string' },
      longName: { name: 'longName', type: 'string' },
      dependency: { name: 'dependency', type: 'link' },
      source: { name: 'source', type: 'link' },
    },
    identifiers: ['@class', 'name', 'sourceId', 'source.name'],
    getPreview: () => 'ontology',
  },
});

describe('<DetailDrawer />', () => {
  let wrapper;

  beforeAll(() => {
    spy(DetailDrawer.prototype, 'formatRelationships');
    spy(DetailDrawer.prototype, 'formatIdentifiers');
    spy(DetailDrawer.prototype, 'formatOtherProps');
    spy(DetailDrawer.prototype, 'componentDidUpdate');
    spy(DetailDrawer.prototype, 'formatLongValue');
    spy(DetailDrawer.prototype, 'handleExpand');
    spy(DetailDrawer.prototype, 'handleLinkExpand');
  });

  it('inits and does not call field formatting functions', () => {
    wrapper = shallow(<DetailDrawer />);
    expect(DetailDrawer.prototype.formatRelationships).to.have.property('callCount', 0);
    expect(DetailDrawer.prototype.formatIdentifiers).to.have.property('callCount', 0);
    expect(DetailDrawer.prototype.formatOtherProps).to.have.property('callCount', 0);
  });

  it('does not crash with test node', () => {
    const node = {
      '@class': 'Ontology',
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    };

    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatRelationships).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatIdentifiers).to.have.property('callCount', 2);
    expect(DetailDrawer.prototype.formatOtherProps).to.have.property('callCount', 1);
    expect(wrapper.children().type()).to.equal(Drawer);
  });

  it('does not crash when componentDidUpdate is called', () => {
    wrapper = mount(<DetailDrawer />);
    wrapper.setState({});
    expect(DetailDrawer.prototype.componentDidUpdate).to.have.property('callCount', 1);
  });

  it('triggers passed in handlers on events', () => {
    const node = {
      '@class': 'Ontology',
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
    };
    const onClose = jest.fn();
    const handleNodeEditStart = jest.fn();

    wrapper = mount((
      <DetailDrawer
        node={node}
        schema={testSchema}
        onClose={onClose}
        handleNodeEditStart={handleNodeEditStart}
      />
    ));
    wrapper.find('button').first().simulate('click');
    expect(onClose.mock.calls.length).to.eq(1);
    wrapper.find('.detail-edit-btn button').simulate('click');
    expect(handleNodeEditStart.mock.calls.length).to.eq(1);
  });

  it('formatLongValue function is triggered on long inputs only', () => {
    const node = {
      '@class': 'Ontology',
      // 1st long field
      name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      // 2nd long field
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      sourceId: 'test sourceId',
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    };
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatLongValue).to.have.property('callCount', 2);
  });

  it('clicking expanding list items triggers handler', () => {
    const node = {
      '@class': 'Ontology',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
    };
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    wrapper.find('div[role="button"]').simulate('click');
    wrapper.find('div[role="button"]').simulate('click');
    expect(DetailDrawer.prototype.handleExpand).to.have.property('callCount', 2);
  });

  it('initializes relationships and properly applies handlers to DOM nodes', () => {
    const node = {
      '@class': 'Ontology',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      in_AliasOf: [{
        '@class': 'AliasOf',
        '@rid': '#141',
        in: {
          '@rid': '#135',
        },
        out: {
          '@class': 'AliasOf',
          '@rid': '#136',
          source: {
            name: 'test source also',
          },
          name: 'hello',
        },
      }],
    };
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatRelationships.callCount).to.be.gt(1);
    wrapper.find('div.detail-link-wrapper[role="button"]').first().simulate('click');
    wrapper.find('div.detail-link-wrapper[role="button"]').first().simulate('click');
    expect(DetailDrawer.prototype.handleLinkExpand).to.have.property('callCount', 2);
  });

  it('expect detail-nested-list class to be rendered for nested property', () => {
    const node = {
      '@class': 'test',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      dependency: {
        '@class': 'Ontology',
        '@rid': '#4213',
        name: 'dependency one',
        source: {
          '@class': 'Ontology',
          name: 'ncit',
        },
      },
    };

    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(wrapper.find('.detail-nested-list')).to.have.length.gt(0);
  });
});
