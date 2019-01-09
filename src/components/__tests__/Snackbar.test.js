import React from 'react';
import { mount } from 'enzyme';
import { SnackbarProvider, withSnackbar } from '../Snackbar/Snackbar';

describe('Snackbar Context', () => {
  it('consumer inherits value', () => {
    const Div = withSnackbar((props) => {
      const { snackbar } = props;
      return (
        <div value={snackbar} id="test-div" />
      );
    });

    const wrapper = mount(
      <SnackbarProvider value={{ snackbar: 'test' }}>
        <Div />
      </SnackbarProvider>,
    );

    expect(typeof wrapper.find('#test-div').props().value).toBe('object');
    /* eslint-disable */
    expect(wrapper.find('#test-div').props().value.add).toBeDefined();
    expect(wrapper.find('#test-div').props().value.clear).toBeDefined();
    /* eslint-enable */
    wrapper.find('#test-div').props().value.clear();
  });

  it('activates snackbar', () => {
    const mockFn = jest.fn();
    const TestButton = withSnackbar((props) => {
      const { snackbar } = props;
      return (
        <button
          type="button"
          onClick={() => snackbar.add('test', 'test', mockFn)}
          id="test-btn"
        >
          click
        </button>
      );
    });

    const wrapper = mount(
      <SnackbarProvider value={{ snackbar: 'test' }}>
        <TestButton />
      </SnackbarProvider>,
    );
    wrapper.find('#test-btn').simulate('click');
    wrapper.find('#test-btn').simulate('click');
    wrapper.find('div button').first().simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });
});
