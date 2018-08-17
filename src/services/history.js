import { createBrowserHistory } from 'history';
import auth from './auth';
/**
 * History object initialization
 *
 * Here you can set listeners or other history configs.
 */
const history = createBrowserHistory();


/**
 * Checks authentication token on each page change.
 */
history.listen((location) => {
  if ((!auth.getToken() || auth.isExpired()) && location.pathname !== '/login') {
    history.push('/login');
  }
});


export default history;
