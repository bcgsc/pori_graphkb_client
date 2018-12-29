import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';
import MainNav from '../MainNav';

describe('<MainNav />', () => {
  let wrapper;

  it('correctly renders', () => {
    wrapper = mount(
      <MainNav />,
    );
    expect(wrapper.type()).to.equal(MainNav);
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
        <MainNav open links={testLinks} onChange={() => onChange} />
      </Router>,
    );
    expect(wrapper.find('#icon')).to.have.lengthOf(1);
    expect(wrapper.find('#test-link')).to.have.length.gt(1);

    wrapper.find('#test-expand').first().simulate('click');
    wrapper.find('#test-expand').first().simulate('click');
    wrapper.find('.drawer-logo button').first().simulate('click');
    expect(onChange.mock.calls.length).to.eq(1);
  });
});
