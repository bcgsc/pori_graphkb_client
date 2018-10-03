import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import { TextField } from '@material-ui/core';
import AutoSearchComponent from './AutoSearchComponent';

spy(AutoSearchComponent.prototype, 'componentDidMount');

describe('<AutoSearchComponent />', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<AutoSearchComponent />);
  });

  it('structure', () => {
    expect(wrapper.type()).to.equal('div');
    expect(wrapper.children().type()).to.equal('div');
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });
});
