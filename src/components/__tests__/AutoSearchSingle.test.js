import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import { TextField } from '@material-ui/core';
import Downshift from 'downshift';
import AutoSearchSingle from '../AutoSearchSingle/AutoSearchSingle';
import AutoSearchBase from '../AutoSearchBase/AutoSearchBase';

spy(AutoSearchSingle.prototype, 'refreshOptions');

describe('<AutoSearchSingle />', () => {
  let wrapper;

  it('should correctly render a Downshift component, with nested div and a TextField', () => {
    wrapper = mount(<AutoSearchSingle />);
    expect(wrapper.children().type()).to.equal(AutoSearchBase);
    expect(wrapper.children().children().type()).to.equal(Downshift);
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });

  it('allows props to be correctly distributed', () => {
    wrapper = mount((
      <AutoSearchSingle
        name="testName"
        label="testLabel"
        placeholder="testPlaceHolder"
        disabled
      />));
    expect(wrapper.find('input').props().name).to.equal('testName');
    expect(wrapper.find('input').props().placeholder).to.equal('testPlaceHolder');
    expect(wrapper.find('label').text()).to.equal('testLabel');
    expect(wrapper.find('input').props().disabled).to.equal(true);
  });

  it('focuses input component', () => {
    wrapper = mount((
      <AutoSearchSingle />
    ));
    wrapper.simulate('click');
    const focusedEl = document.activeElement;
    expect(wrapper.find('input').matchesElement(focusedEl));
  });

  it('input events trigger handlers', () => {
    // Mocks
    const onChange = jest.fn();

    wrapper = mount((
      <AutoSearchSingle
        onChange={onChange}
        value="test"
      />
    ));
    wrapper.setState({ options: [{ '@rid': '#1', lame: 'test' }, { '@rid': '#3', name: 'test' }] });
    wrapper.simulate('change');

    wrapper.find('input').simulate('change', { target: { '@rid': '#5', value: 'test' } });
    wrapper.find('input').simulate('focus');
    wrapper.find('input').simulate('keyup');

    wrapper.setState({ options: [{ name: 'test' }] });
    wrapper.find('input').simulate('blur');

    expect(onChange.mock.calls.length).to.be.gt(0);
    expect(AutoSearchSingle.prototype.refreshOptions).to.have.property('callCount', 1);
  });

  it('loading results displays spinner', () => {
    const onChange = jest.fn();
    wrapper = mount((
      <AutoSearchSingle
        onChange={onChange}
        dense
      />
    ));

    wrapper.setState({ emptyFlag: false, loading: true });
    /* eslint-disable-next-line */
    expect(wrapper.find('#autosearch-spinner')).to.exist;
  });

  it('componentWillUnmount doesn\'t crash', () => {
    const onChange = jest.fn();

    wrapper = mount((
      <AutoSearchSingle
        onChange={onChange}
        dense
      />
    ));
    wrapper.unmount();
  });
});
