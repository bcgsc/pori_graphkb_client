import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { spy } from 'sinon';
import { Drawer } from '@material-ui/core';
import DetailDrawer from '../DetailDrawer/DetailDrawer';
import Schema from '../../models/schema';
import classes from '../../models/classes';

const testSchema = new Schema({
  test: {
    name: 'test',
    properties: [
      { name: 'dependency', type: 'link' },
    ],
  },
  AliasOf: {
    name: 'AliasOf',
    inherits: ['E'],
  },
  Ontology: {
    name: 'Ontology',
    properties: [
      { name: 'name', type: 'string' },
      { name: 'longName', type: 'string' },
      { name: 'dependency', type: 'link' },
    ],
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
    const node = new classes.Ontology({
      '@class': 'Ontology',
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    }, testSchema);

    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatRelationships).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatIdentifiers).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatOtherProps).to.have.property('callCount', 1);
    expect(wrapper.children().type()).to.equal(Drawer);
  });

  it('does not crash when componentDidUpdate is called', () => {
    wrapper = mount(<DetailDrawer />);
    wrapper.setState({});
    expect(DetailDrawer.prototype.componentDidUpdate).to.have.property('callCount', 1);
  });

  it('triggers passed in handlers on events', () => {
    const node = new classes.Ontology({
      '@class': 'Ontology',
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
    }, testSchema);
    const onClose = jest.fn();
    const handleNodeEditStart = jest.fn();

    wrapper = mount((
      <DetailDrawer
        node={node}
        schema={testSchema}
        onClose={onClose}
        handleNodeEditStart={handleNodeEditStart}
        isEdge
      />
    ));
    wrapper.find('button').first().simulate('click');
    expect(onClose.mock.calls.length).to.eq(1);
    wrapper.find('.detail-edit-btn button').simulate('click');
    expect(handleNodeEditStart.mock.calls.length).to.eq(1);
  });

  it('formatLongValue function is triggered on long inputs only', () => {
    const node = new classes.Ontology({
      '@class': 'Ontology',
      // 1st long field
      name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      // 2nd long field
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    }, testSchema);
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatLongValue).to.have.property('callCount', 2);
  });

  it('clicking expanding list items triggers handler', () => {
    const node = new classes.Ontology({
      '@class': 'Ontology',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
    }, testSchema);
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    wrapper.find('div[role="button"]').simulate('click');
    wrapper.find('div[role="button"]').simulate('click');
    expect(DetailDrawer.prototype.handleExpand).to.have.property('callCount', 2);
  });

  it('initializes relationships and properly applies handlers to DOM nodes', () => {
    const node = new classes.Ontology({
      '@class': 'Ontology',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      in_AliasOf: [{
        '@rid': '#141',
        in: {
          '@rid': '#135',
        },
        out: {
          '@rid': '#136',
          source: {
            name: 'test source also',
          },
          name: 'hello',
        },
      }],
    }, testSchema);
    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    expect(DetailDrawer.prototype.formatRelationships.callCount).to.be.gt(1);
    wrapper.find('div[role="button"]').first().simulate('click');
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(DetailDrawer.prototype.handleLinkExpand).to.have.property('callCount', 2);
  });

  it('expect detail-nested-list class to be rendered for nested property', () => {
    const node = new classes.Ontology({
      '@class': 'test',
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      dependency: {
        '@rid': '#4213',
        name: 'dependency one',
        source: {
          name: 'ncit',
        },
      },
    }, testSchema);

    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(wrapper.find('.detail-nested-list')).to.have.length.gt(0);
  });
});
