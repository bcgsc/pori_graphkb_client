import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import App from './App';

describe('test', () => {
  it('calls componentDidMount', () => {
    mount(<App />);
    expect(App.prototype.componentDidMount).to.be.undefined;
  });
});
