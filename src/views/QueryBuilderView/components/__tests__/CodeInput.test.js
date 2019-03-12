import React from 'react';
import { mount } from 'enzyme';
import CodeInput from '../CodeInput';

describe('<CodeInput />', () => {
  let wrapper;

  it('renders default layers', () => {
    wrapper = mount(<CodeInput />);
    expect(wrapper.find('textarea')).toHaveLength(3);
  });

  it('renders a custom rule', () => {
    wrapper.setProps({ value: 'A B C', rules: [{ regex: /A/, color: 'red', className: 'a-match' }] });
    wrapper.update();
    expect(wrapper.find('textarea.a-match')).toHaveLength(1);
  });

  it('handles TAB keypresses properly', () => {
    wrapper.setProps({ value: '', onChange: jest.fn() });
    wrapper.update();
    wrapper.find('#typeTextArea').first().simulate('keydown');
    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 9,
          target: { value: '' },
          selectionStart: 0,
          selectionEnd: 0,
        });
    expect(wrapper.props().onChange.mock.calls.length).toBe(1);

    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 9,
          shiftKey: true,
          target: { value: '   ' },
          selectionStart: 3,
          selectionEnd: 3,
        });
    setTimeout(() => expect(wrapper.props().onChange.mock.calls.length).toBe(2), 0);
  });

  it('handles BACKSPACE keypresses properly', () => {
    wrapper.setProps({ value: '', onChange: jest.fn() });
    wrapper.update();
    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 8,
          ctrlKey: true,
          target: { value: 'f   ' },
          selectionStart: 2,
          selectionEnd: 2,
        });
    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 8,
          ctrlKey: true,
          target: { value: '' },
          selectionStart: 0,
          selectionEnd: 0,
        });
  });

  it('handles DELETE keypresses properly', () => {
    wrapper.setProps({ value: '', onChange: jest.fn() });
    wrapper.update();
    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 46,
          ctrlKey: true,
          target: { value: '   ' },
          selectionStart: 0,
          selectionEnd: 0,
        });
    expect(wrapper.props().onChange.mock.calls.length).toBe(1);
    wrapper
      .find('#typeTextArea')
      .first()
      .simulate('keydown',
        {
          keyCode: 46,
          ctrlKey: true,
          target: { value: 'a' },
          selectionStart: 0,
          selectionEnd: 0,
        });
    expect(wrapper.props().onChange.mock.calls.length).toBe(1);
  });

  it('scrolls without crashing', () => {
    wrapper.find('#typeTextArea').first().simulate('scroll');
  });
});
