import { mount } from 'enzyme';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthContext } from '@/components/Auth';

import MainNav from '../MainNav';


describe('<MainNav />', () => {
  let wrapper;

  test('correctly renders', () => {
    wrapper = mount(
      <BrowserRouter>
        <AuthContext.Provider value={{}}>
          <MainNav />
        </AuthContext.Provider>
      </BrowserRouter>,
    );
    expect(wrapper.find(MainNav)).toHaveLength(1);
  });
});
