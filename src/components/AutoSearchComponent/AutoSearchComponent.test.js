import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import AutoSearchComponent from './AutoSearchComponent';

spy(AutoSearchComponent.prototype, 'componentDidMount');

describe('<Foo />', () => {
  it('calls componentDidMount', () => {
    mount(<AutoSearchComponent />);
    expect(AutoSearchComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });
});
