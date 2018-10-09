import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import DownloadFileComponent from './DownloadFileComponent';

describe('<DetailDrawer />', () => {
  let wrapper;

  it('init', () => {
    wrapper = shallow((
      <DownloadFileComponent>
        <button type="button" />
      </DownloadFileComponent>
    ));
    expect(wrapper.type()).to.eq('div');
    expect(wrapper.children().type()).to.eq('button');
  });

  it('classes', () => {
    wrapper = shallow((
      <DownloadFileComponent className="foo">
        <button type="button" className="bar" />
      </DownloadFileComponent>
    ));
    expect(wrapper.hasClass('foo'));
    expect(wrapper.children().hasClass('bar'));
  });
});
