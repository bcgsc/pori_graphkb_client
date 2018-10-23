import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { spy } from 'sinon';
import { Drawer } from '@material-ui/core';
import DetailDrawer from '../DetailDrawer/DetailDrawer';
import { Record, Schema } from '../../services/knowledgebase';

describe('<DetailDrawer />', () => {
  let wrapper;

  beforeAll(() => {
    const edges = ['AliasOf', 'SubClassOf'];
    Record.loadEdges(edges);
    spy(DetailDrawer.prototype, 'formatRelationships');
    spy(DetailDrawer.prototype, 'formatIdentifiers');
    spy(DetailDrawer.prototype, 'formatOtherProps');
    spy(DetailDrawer.prototype, 'componentDidUpdate');
    spy(DetailDrawer.prototype, 'formatLongValue');
    spy(DetailDrawer.prototype, 'handleExpand');
    spy(DetailDrawer.prototype, 'handleLinkExpand');
  });

  it('inits and calls field formatting functions', () => {
    wrapper = shallow(<DetailDrawer />);
    expect(DetailDrawer.prototype.formatRelationships).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatIdentifiers).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatOtherProps).to.have.property('callCount', 1);
  });

  it('does not crash with test node', () => {
    const node = {
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    };

    wrapper = mount(<DetailDrawer node={node} />);
    expect(wrapper.children().type()).to.equal(Drawer);
  });

  it('does not crash when componentDidUpdate is called', () => {
    wrapper = mount(<DetailDrawer />);
    wrapper.setState({});
    expect(DetailDrawer.prototype.componentDidUpdate).to.have.property('callCount', 1);
  });

  it('triggers passed in handlers on events', () => {
    const node = {
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
    };
    const onClose = jest.fn();
    const handleNodeEditStart = jest.fn();

    wrapper = mount((
      <DetailDrawer
        node={node}
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
    const node = {
      // 1st long field
      name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      // 2nd long field
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
    };
    wrapper = mount(<DetailDrawer node={node} />);
    expect(DetailDrawer.prototype.formatLongValue).to.have.property('callCount', 2);
  });

  it('clicking expanding list items triggers handler', () => {
    const node = {
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
    };
    wrapper = mount(<DetailDrawer node={node} />);
    wrapper.find('div[role="button"]').simulate('click');
    wrapper.find('div[role="button"]').simulate('click');
    expect(DetailDrawer.prototype.handleExpand).to.have.property('callCount', 2);
  });

  it('initializes relationships and properly applies handlers to DOM nodes', () => {
    const node = {
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
    };
    wrapper = mount(<DetailDrawer node={node} />);
    expect(DetailDrawer.prototype.formatRelationships.callCount).to.be.gt(1);
    wrapper.find('div[role="button"]').first().simulate('click');
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(DetailDrawer.prototype.handleLinkExpand).to.have.property('callCount', 2);
  });

  it('expect detail-nested-list class to be rendered for nested property', () => {
    const node = {
      '@rid': '#135',
      name: 'test node best node',
      sourceId: 'test sourceId',
      '@class': 'test',
      dependency: {
        '@rid': '#4213',
        name: 'dependency one',
        source: {
          name: 'ncit',
        },
      },
    };

    const testSchema = new Schema({
      test: {
        properties: [
          { name: 'dependency', type: 'link' },
        ],
      },
    });

    wrapper = mount(<DetailDrawer node={node} schema={testSchema} />);
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(wrapper.find('.detail-nested-list')).to.have.length.gt(0);
  });
});
