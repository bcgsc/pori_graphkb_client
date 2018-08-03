import { createBrowserHistory } from 'history';
import auth from './auth';

const history = createBrowserHistory();
history.listen((location) => {
  if ((!auth.getToken() || auth.isExpired()) && location.pathname !== '/login') {
    history.push('/login');
  }
});
export default history;
