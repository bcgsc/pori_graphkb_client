import React from 'react';
import { mount } from 'enzyme';
import {
  Tooltip,
} from '@material-ui/core';

import FieldHelp from '../FieldHelp';


describe('FieldHelp', () => {
  test('includes example if given', () => {
    const wrapper = mount((
      <FieldHelp description="does stuff" example="3" />
    ));
    const click = wrapper.find(Tooltip);
    expect(click).toHaveLength(1);
    expect(click.prop('title')).toEqual('does stuff (Example: 3)');
  });
  test('returns null if no description or example', () => {
    const wrapper = mount((
      <FieldHelp />
    ));
    expect(wrapper.find(Tooltip)).toHaveLength(0);
  });
  test('ignores example if not given', () => {
    const wrapper = mount((
      <FieldHelp description="does stuff" />
    ));
    const click = wrapper.find(Tooltip);
    expect(click).toHaveLength(1);
    expect(click.prop('title')).toEqual('does stuff');
  });
});
