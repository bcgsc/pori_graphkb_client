import React from 'react';
import { mount } from 'enzyme';
import { KBContext, withKB } from '..';

describe('KB Context provider and consumers', () => {
  test('consumer inherits value', () => {
    const Div = withKB((props) => {
      const { schema } = props;
      return (
        <div value={schema} id="test-div" />
      );
    });

    const wrapper = mount(
      <KBContext.Provider value={{ schema: 'test' }}>
        <Div />
      </KBContext.Provider>,
    );

    expect(wrapper.find('#test-div').props().value).toBe('test');
  });
});
