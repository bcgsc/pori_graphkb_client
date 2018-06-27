import axios from "axios";
import promise from "promise";
import * as jc from "json-cycle";

// const API_BASE_URL = "http://kbapi01:8088/api";
const API_BASE_URL = "http://kbapi01:8006/api/v0.0.6";

export default class Api {
  getToken() {
    return localStorage.getItem("kbToken");
  }

  getHeaders() {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    if (this.getToken()) {
      headers.append("Authorization", this.getToken());
    }
    return headers;
  }

  patch(endpoint, payload) {
    const init = {
      method: "PATCH",
      body: JSON.stringify(payload)
    };
    return this.fetchWithInterceptors(endpoint, init);
  }

  get(endpoint) {
    const init = {
      method: "GET"
    };
    return this.fetchWithInterceptors(endpoint, init);
  }

  post(endpoint, payload) {
    const init = {
      method: "POST",
      body: JSON.stringify(payload)
    };

    return this.fetchWithInterceptors(endpoint, init);
  }

  fetchWithInterceptors(endpoint, init) {
    const initWithInterceptors = {
      ...init,
      headers: this.getHeaders(),
      cache: "default"
    };

    return fetch(new Request(API_BASE_URL + endpoint, initWithInterceptors))
      .then(response => {
        console.log(response);
        if (response.ok) {
          console.log("ok");
          return response.json();
        } else {
          return promise.reject(response);
        }
      })
      .then(json => {
        console.log(json);
        if (json.result) json = json.result; //???
        return jc.retrocycle(json);
      })
      .catch(error => {
        if (error.status === 401) {
          localStorage.removeItem("kbToken");
        }
        return promise.reject(error.status);
      });
  }
}
