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
      setTimeout(() => history.push('/login'), 0);
    } else if (auth.isExpired()) {
      setTimeout(() => history.push('/login', { timedout: true }), 0);
    }
  }
});

history.prevState = '';

/**
 * Sends the user back a page, unless the previous page was an external site.
 */
history.back = () => {
  if (history.prevState) {
    history.goBack();
  } else {
    history.push('/query');
  }
};

export default history;
