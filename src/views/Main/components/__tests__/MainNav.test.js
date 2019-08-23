import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';


import MainNav from '../MainNav';
import { KBContext } from '../../../../components/KBContext';


describe('<MainNav />', () => {
  let wrapper;

  it('correctly renders', () => {
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
