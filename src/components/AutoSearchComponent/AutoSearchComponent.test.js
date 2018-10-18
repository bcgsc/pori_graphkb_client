import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import { TextField } from '@material-ui/core';
import Downshift from 'downshift';
import AutoSearchComponent from './AutoSearchComponent';

spy(AutoSearchComponent.prototype, 'refreshOptions');

describe('<AutoSearchComponent />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = mount(<AutoSearchComponent />);
    expect(wrapper.children().type()).to.equal(Downshift);
    expect(wrapper.children().children().type()).to.equal('div');
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });

  it('allows props', () => {
    wrapper = mount((
      <AutoSearchComponent
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

  it('focusing', () => {
    wrapper = mount((
      <AutoSearchComponent />
    ));
    wrapper.simulate('click');
    const focusedEl = document.activeElement;
    expect(wrapper.find('input').matchesElement(focusedEl));
  });

  it('input events', () => {
    // Mocks
    const onChange = jest.fn();
    AutoSearchComponent.prototype.callApi = jest.fn();

    wrapper = mount((
      <AutoSearchComponent
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
    expect(AutoSearchComponent.prototype.refreshOptions).to.have.property('callCount', 1);
  });

  it('loading', () => {
    const onChange = jest.fn();
    wrapper = mount((
      <AutoSearchComponent
        onChange={onChange}
        dense
      />
    ));

    wrapper.setState({ emptyFlag: false, loading: true });
    /* eslint-disable-next-line */
    expect(wrapper.find('#autosearch-spinner')).to.exist;
  });

  it('componentWillUnmount', () => {
    const onChange = jest.fn();

    wrapper = mount((
      <AutoSearchComponent
        onChange={onChange}
        dense
      />
    ));
    wrapper.unmount();
  });
});
