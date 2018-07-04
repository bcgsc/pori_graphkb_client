import * as jc from 'json-cycle';
import auth from './auth';

const API_BASE_URL = 'http://kbapi01:8008/api/v0.0.8';
const CACHE_EXPIRY = 8;

export default class api {
  static getHeaders() {
    const headers = new Headers();
    headers.append('Content-type', 'application/json');
    if (auth.getToken()) {
      headers.append('Authorization', auth.getToken());
    }
    return headers;
  }

  static patch(endpoint, payload) {
    const init = {
      method: 'PATCH',
      body: JSON.stringify(payload),
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  static get(endpoint) {
    const init = {
      method: 'GET',
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  static post(endpoint, payload) {
    const init = {
      method: 'POST',
      body: JSON.stringify(payload),
    };

    return api.fetchWithInterceptors(endpoint, init);
  }

  static delete(endpoint) {
    const init = {
      method: 'DELETE',
    };

    return api.fetchWithInterceptors(endpoint, init);
  }

  static fetchWithInterceptors(endpoint, init) {
    const initWithInterceptors = {
      ...init,
      headers: api.getHeaders(),
    };
    return fetch(new Request(API_BASE_URL + endpoint, initWithInterceptors))
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      })
      .catch((error) => {
        if (error.status === 401) {
          auth.clearToken();
        }
        return Promise.reject(error);
      });
  }

  static getEdgeTypes() {
    const edgeTypes = localStorage.getItem('edgeTypes');
    const edgeTypeExpiry = localStorage.getItem('edgeTypesExpiry');
    if (
      !edgeTypes
      || (edgeTypes && edgeTypeExpiry && edgeTypeExpiry < Date.now().valueOf())
      || !edgeTypeExpiry
    ) {
      return api.loadEdges();
    }
    return Promise.resolve(JSON.parse(edgeTypes));
  }

  static loadEdges() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const list = [];
      Object.keys(cycled).forEach((key) => {
        if (
          cycled[key].inherits.includes('E') && cycled[key].inherits.includes('OntologyEdge')
        ) {
          list.push({ name: key });
        }
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem('edgeTypesExpiry', expiry.getTime());
      localStorage.setItem('edgeTypes', JSON.stringify(list));
      return Promise.resolve(list);
    });
  }

  static getSources() {
    const sources = localStorage.getItem('sources');
    const sourcesExpiry = localStorage.getItem('sourcesExpiry');
    if (
      !sources || (sources && sourcesExpiry && sourcesExpiry < Date.now().valueOf())
    ) {
      return api.loadSources();
    }
    return Promise.resolve(JSON.parse(sources));
  }

  static loadSources() {
    return api.get('/sources').then((response) => {
      const cycled = jc.retrocycle(response.result);
      const list = [];
      cycled.forEach(source => list.push(source));

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem('sourcesExpiry', expiry.getTime());
      localStorage.setItem('sources', JSON.stringify(list));

      return Promise.resolve(list);
    });
  }

  static autoSearch(endpoint, property, value, limit) {
    return api.get(
      `/${endpoint}?${property}=~${value}&limit=${limit}&neighbors=1`,
    );
  }
}
