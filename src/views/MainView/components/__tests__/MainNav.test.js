import { mount } from 'enzyme';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { SecurityContext } from '@/components/SecurityContext';

import MainNav from '../MainNav';


describe('<MainNav />', () => {
  let wrapper;

  test('correctly renders', () => {
    wrapper = mount(
      <BrowserRouter>
        <SecurityContext.Provider value={{}}>
          <MainNav />
        </SecurityContext.Provider>
      </BrowserRouter>,
    );
    expect(wrapper.find(MainNav)).toHaveLength(1);
  });
});
