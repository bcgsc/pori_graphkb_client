import { mount } from 'enzyme';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { KBContext } from '@/components/KBContext';

import MainNav from '../MainNav';


describe('<MainNav />', () => {
  let wrapper;

  test('correctly renders', () => {
    wrapper = mount(
      <BrowserRouter>
        <KBContext.Provider value={{}}>
          <MainNav />
        </KBContext.Provider>
      </BrowserRouter>,
    );
    expect(wrapper.find(MainNav)).toHaveLength(1);
  });
});
