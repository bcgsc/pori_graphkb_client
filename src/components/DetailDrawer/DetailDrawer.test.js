import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import { Drawer } from '@material-ui/core';
import DetailDrawer from './DetailDrawer';

describe('<DetailDrawer />', () => {
  let wrapper;

  it('init', () => {
    spy(DetailDrawer.prototype, 'formatRelationships');
    spy(DetailDrawer.prototype, 'formatIdentifiers');
    spy(DetailDrawer.prototype, 'formatOtherProps');
    wrapper = mount(<DetailDrawer />);
    expect(DetailDrawer.prototype.formatRelationships).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatIdentifiers).to.have.property('callCount', 1);
    expect(DetailDrawer.prototype.formatOtherProps).to.have.property('callCount', 1);
  });

  it('with test node', () => {
    const node = {
      name: 'test node',
      sourceId: 'test sourceId',
      source: {
        name: 'test source',
      },
    };

    wrapper = mount(<DetailDrawer node={node} />);
    expect(wrapper.children().type()).to.equal(Drawer);
  });
});
