/**
 * History object initialization
 *
 * Here you can set listeners or other history configs.
 * @module
 */

import { createBrowserHistory } from 'history';
import auth from './auth';

const history = createBrowserHistory();


/**
 * Checks authentication token on each page change.
 */
history.listen((location) => {
  history.prevState = location.pathname;
  if (location.pathname !== '/login') {
    if (!auth.getToken()) {
      history.push('/login');
    } else if (auth.isExpired()) {
      history.push('/login', { timedout: true });
    }
  }
});

history.prevState = '';

history.back = () => {
  if (history.prevState) {
    history.goBack();
  } else {
    history.push('/query');
  }
};

export default history;
