import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthContext } from '@/components/Auth';

import MainNav from '../MainNav';

describe('<MainNav />', () => {
  test('correctly renders', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{}}>
          <MainNav />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    // find some element from nav
    expect(screen.getByText('About')).toBeTruthy();
  });
});
