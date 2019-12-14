import { mount } from 'enzyme';
import React from 'react';

import { SecurityContext, withKB } from '..';

describe('KB Context provider and consumers', () => {
  test('consumer inherits value', () => {
    const Div = withKB((props) => {
      const { authorizationToken } = props;
      return (
        <div id="test-div" value={authorizationToken} />
      );
    });

    const wrapper = mount(
      <SecurityContext.Provider value={{ authorizationToken: 'test' }}>
        <Div />
      </SecurityContext.Provider>,
    );

    expect(wrapper.find('#test-div').props().value).toBe('test');
  });
});
