import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import DownloadFileComponent from '../DownloadFileComponent';

describe('<DetailDrawer />', () => {
  let wrapper;

  it('renders child and wrapper correctly', () => {
    wrapper = shallow((
      <DownloadFileComponent>
        <button type="button" />
      </DownloadFileComponent>
    ));
    expect(wrapper.type()).to.eq('div');
    expect(wrapper.children().type()).to.eq('button');
  });

  it('applies classes to children and wrapper properly', () => {
    wrapper = shallow((
      <DownloadFileComponent className="foo">
        <button type="button" className="bar" />
      </DownloadFileComponent>
    ));
    expect(wrapper.hasClass('foo'));
    expect(wrapper.children().hasClass('bar'));
  });

  it('calls passed in file content function', () => {
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

  it('IE browser doesn\'t crash everything (downloads correctly)', () => {
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
    expect(mock.mock.calls.length).to.eq(1);
  });
});
