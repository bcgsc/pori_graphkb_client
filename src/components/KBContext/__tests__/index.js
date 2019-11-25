import { mount } from 'enzyme';
import React from 'react';

import { KBContext, withKB } from '..';

describe('KB Context provider and consumers', () => {
  test('consumer inherits value', () => {
    const Div = withKB((props) => {
      const { authorizationToken } = props;
      return (
        <div value={authorizationToken} id="test-div" />
      );
    });

    const wrapper = mount(
      <KBContext.Provider value={{ authorizationToken: 'test' }}>
        <Div />
      </KBContext.Provider>,
    );

    expect(wrapper.find('#test-div').props().value).toBe('test');
  });
});
