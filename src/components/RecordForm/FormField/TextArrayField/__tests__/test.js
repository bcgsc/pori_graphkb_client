import React from 'react';
import { mount } from 'enzyme';
import {
  TextField,
  Chip,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import RefreshIcon from '@material-ui/icons/Refresh';

import TextArrayField from '..';


describe('TextArrayField', () => {
  test('Add value with Enter', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
      />
    ));
    // input the text and hit the enter key
    const textElement = wrapper.find(TextField);
    textElement.prop('onKeyDown')(
      { key: 'Enter', target: { value: 'someElement' } },
    );
    wrapper.update();
    // should now be a single chip element
    expect(wrapper.find(Chip)).toHaveLength(1);
  });
  test('Add value with button', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
      />
    ));
    // input the text
    const textElement = wrapper.find(TextField);
    textElement.prop('onChange')(
      { target: { value: 'someElement' } },
    );
    wrapper.update();
    // hit the add button
    wrapper.find(IconButton).prop('onClick')();
    wrapper.update();
    // should now be a single chip element
    expect(wrapper.find(Chip)).toHaveLength(1);
  });
  test('Delete added value with backspace', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
      />
    ));
    // input the text and hit the enter key
    wrapper.find(TextField).prop('onKeyDown')(
      { key: 'Enter', target: { value: 'someElement' } },
    );
    wrapper.update();
    // should now be a single chip element
    expect(wrapper.find(Chip)).toHaveLength(1);
    wrapper.find(TextField).prop('onKeyDown')(
      { key: 'Backspace', target: { value: '' } },
    );
    wrapper.update();
    // should not be any chips
    expect(wrapper.find(Chip)).toHaveLength(0);
  });
  test('Delete added value with clear', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
      />
    ));
    // input the text and hit the enter key
    const textElement = wrapper.find(TextField);
    textElement.prop('onKeyDown')(
      { key: 'Enter', target: { value: 'someElement' } },
    );
    // should now be a single chip element
    wrapper.update();
    expect(wrapper.find(Chip)).toHaveLength(1);
    // now delete the newly added chip
    wrapper.find(Chip).prop('onDelete')();
    // should not have any chips now
    wrapper.update();
    expect(wrapper.find(Chip)).toHaveLength(0);
  });
  test('Delete initial value with clear', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
        value={['someElement']}
      />
    ));
    // input the text and hit the enter key
    expect(wrapper.find(Chip)).toHaveLength(1);
    expect(wrapper.find(CancelIcon)).toHaveLength(1);
    // now delete the newly added chip
    wrapper.find(Chip).prop('onDelete')();
    // should not have any chips now
    wrapper.update();
    expect(wrapper.find(Chip)).toHaveLength(1);
    expect(wrapper.find(RefreshIcon)).toHaveLength(1);
  });
  test('Add duplicate value', () => {
    const wrapper = mount((
      <TextArrayField
        name="test"
        onValueChange={jest.fn()}
        value={['someElement']}
      />
    ));
    expect(wrapper.find(Chip)).toHaveLength(1);
    // input the text and hit the enter key
    wrapper.find(TextField).prop('onKeyDown')(
      { key: 'Enter', target: { value: 'someElement' } },
    );
    wrapper.update();
    expect(wrapper.find(TextField).prop('helperText')).toContain('Elements must be unique');
    // should now be a single chip element
    expect(wrapper.find(Chip)).toHaveLength(1);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
});
