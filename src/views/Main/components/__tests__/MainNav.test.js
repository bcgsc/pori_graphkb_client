import React from 'react';
import { IconButton } from '@material-ui/core';
import { mount } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';
import MainNav from '../MainNav';

describe('<MainNav />', () => {
  let wrapper;

  it('correctly renders', () => {
    wrapper = mount(
      <MainNav />,
    );
    expect(wrapper.type()).toBe(MainNav);
  });

  const testLinks = [
    {
      label: 'test',
      route: '/test',
      icon: <div id="icon" />,
      MenuProps: { id: 'test-link' },
    },
    {
      label: 'expandable',
      icon: <div id="expicon" />,
      MenuProps: { id: 'test-expand' },
      nestedItems: [
        { label: 'nested', route: '/nest' },
      ],
    },
  ];

  it('correctly renders links', () => {
    const onChange = jest.fn();
    wrapper = mount(
      <Router>
        <MainNav open links={testLinks} onChange={onChange} />
      </Router>,
    );
    expect(wrapper.find('#icon')).toHaveLength(1);
    expect(wrapper.find('#test-link').length).toBeGreaterThan(1);

    wrapper.find('#test-expand').first().simulate('click');
    wrapper.find('#test-expand').first().simulate('click');
    wrapper.find('.main-nav-drawer__banner').find(IconButton).prop('onClick')();
    expect(onChange.mock.calls.length).toBe(1);
  });
});
