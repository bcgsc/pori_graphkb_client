import { FormControl } from '@material-ui/core';
import { mount } from 'enzyme';
import React from 'react';

import ResourceSelectComponent from '..';

const mockData = [
  { name: 'opt-1', '@rid': '#1' },
  { name: 'opt-2', '@rid': '#2' },
  { name: 'opt-3', '@rid': '#3' },
  { name: 'opt-4', '@rid': '#4' },
  { name: 'opt-5', '@rid': '#5' },
];

describe('<ResourceSelectComponent />', () => {
  let wrapper;
  const val = 'best';

  test('renders FormControl child correctly', () => {
    wrapper = mount(
      <ResourceSelectComponent
        resources={mockData}
        value={val}
      />,
    );
    expect(wrapper.children().type()).toBe(FormControl);
  });

  test('props are passed down correctly', () => {
    wrapper = mount(
      <ResourceSelectComponent
        name="test"
        resources={mockData}
        value={val}
      />,
    );
    expect(wrapper.find('input#resource-select-test').props().name).toBe('test');
    expect(wrapper.find('input#resource-select-test').props().value).toBe('best');
  });
});
