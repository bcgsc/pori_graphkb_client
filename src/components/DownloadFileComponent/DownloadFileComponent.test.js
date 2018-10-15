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

  it('simulate', () => {
    const mock = jest.fn();
    mock.mockReturnValueOnce(10);

    wrapper = shallow((
      <DownloadFileComponent
        className="foo"
        rawFileContent={mock}
      >
        <button type="button" className="bar" />
      </DownloadFileComponent>
    ));
    wrapper.simulate('click');
    wrapper.simulate('keyup', { keyCode: 13 });
  });

  it('IE', () => {
    const mock = jest.fn();
    mock.mockReturnValueOnce(10);

    wrapper = shallow((
      <DownloadFileComponent
        className="foo"
        rawFileContent={mock}
      >
        <button type="button" className="bar" />
      </DownloadFileComponent>
    ));
    window.navigator.msSaveBlob = () => { };
    wrapper.simulate('click');
  });
});
