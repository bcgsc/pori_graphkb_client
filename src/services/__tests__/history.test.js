import { expect } from 'chai';
import history from '../history';

describe('util methods test', () => {
  it('antiCamelCase', () => {
    history.push('/state');
    expect(history.prevState).to.eq('/login');
    history.back();
    expect(history.prevState).to.eq('/login');

    history.prevState = '';
    history.back();
    expect(history.prevState).to.eq('/login');
  });
});
