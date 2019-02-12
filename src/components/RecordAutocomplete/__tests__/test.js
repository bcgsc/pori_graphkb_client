import React from 'react';
import { mount } from 'enzyme';
import AsyncSelect from 'react-select/lib/Async';

import RecordAutocomplete from '..';


const mockSearchHandler = (...values) => {
  const request = jest.fn().mockResolvedValue(
    values.map(
      (value, index) => Object.assign({}, { '@rid': `#1:${index}` }, value),
    ),
  );
  return jest.fn().mockReturnValue({ abort: jest.fn(), request });
};


describe('RecordLinkSuggest', () => {
  describe('fetches option list', () => {
    test.skip('on input', async () => {
      const onValueChange = jest.fn();
      const searchHandler = mockSearchHandler(
        { name: 'bob' }, { name: 'bobby' },
      );
      const wrapper = mount(
        <RecordAutocomplete
          searchHandler={searchHandler}
          name="test"
          onChange={onValueChange}
          itemToString={v => v.name}
          minSearchLength={1}
        />,
      );
      // type in "bob" and open the options menu
      const stateManager = wrapper.find(AsyncSelect).children().first();
      stateManager.setState({ isMenuOpen: true, inputValue: 'bob' });
      // stateManager.prop('onInputChange')();
      stateManager.update();
      // should have 2 options in the drop down
      // focus on the text field to bring up the drop down menu
      expect(searchHandler).toHaveBeenCalled();
      const options = wrapper.find('.record-autocomplete__option');
      expect(options).toHaveLength(2);
    });
    test('from text input', () => {});
    test('does not trigger for short searchTermValues', () => {});
  });
  test.todo('does not allow text input when disabled');
  test.todo('renders new placeholder');
  test.todo('allows multiple selections with isMulti flag');
  test.todo('renders recordchip when initial value is given');
  test.todo('clears input on deleting the initial chip');
});
