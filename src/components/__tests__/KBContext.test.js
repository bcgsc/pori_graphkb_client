import React from 'react';
import { mount } from 'enzyme';
import { KBContext, withKB } from '../KBContext/KBContext';

describe('KB Context provider and consumers', () => {
  it('consumer inherits value', () => {
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
