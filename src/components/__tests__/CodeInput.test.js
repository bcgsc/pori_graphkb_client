import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import CodeInput from '../CodeInput/CodeInput';

describe('<CodeInput />', () => {
  let wrapper;

  it('renders default layers', () => {
    wrapper = mount(<CodeInput />);
    expect(wrapper.find('textarea')).to.have.lengthOf(3);
  });

  it('renders a custom rule', () => {
    wrapper.setProps({ value: 'A B C', rules: [{ regex: /A/, color: 'red', className: 'a-match' }] });
    wrapper.update();
    expect(wrapper.find('textarea.a-match')).to.have.lengthOf(1);
  });
});
