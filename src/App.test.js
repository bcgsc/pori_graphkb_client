import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import App from './App';
/* eslint-disable no-unused-expressions */
describe('test', () => {
  it('calls componentDidMount', () => {
    mount(<App />);
    expect(App.prototype.componentDidMount).to.be.undefined;
  });
});
