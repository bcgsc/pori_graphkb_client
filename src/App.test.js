import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import App from './App';

spy(App.prototype, 'componentDidMount');

describe('test', () => {
  it('calls componentDidMount', () => {
    mount(<App />);
    expect(App.prototype.componentDidMount).to.have.property('callCount', 0);
  });
});
