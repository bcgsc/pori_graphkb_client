"use strict";

import axios from "axios";
import promise from "promise";
import auth from "./auth";
import * as jc from "json-cycle";

const API_BASE_URL = "http://kbapi01:8006/api/v0.0.6";
// const API_BASE_URL = "http://creisle04.phage.bcgsc.ca:8081/api/v0.0.6";

export default class api {
  static getHeaders() {
    const headers = new Headers();
    headers.append("Content-type", "application/json");
    if (auth.getToken()) {
      headers.append("Authorization", auth.getToken());
    }
    return headers;
  }

  static patch(endpoint, payload) {
    const init = {
      method: "PATCH",
      body: JSON.stringify(payload)
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  static get(endpoint) {
    const init = {
      method: "GET"
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  static post(endpoint, payload) {
    const init = {
      method: "POST",
      body: JSON.stringify(payload)
    };

    return api.fetchWithInterceptors(endpoint, init);
  }

  static fetchWithInterceptors(endpoint, init) {
    const initWithInterceptors = {
      ...init,
      headers: api.getHeaders(),
    };
    return fetch(new Request(API_BASE_URL + endpoint, initWithInterceptors))
      .then(response => {
        console.log(response);
        if (response.ok) {
          return response.json();
        } else {
          return promise.reject(response);
        }
      })
      .catch(error => {
        console.error(JSON.parse(error));
        Object.keys(error).forEach(k => console.log(k));
        if (error.status === 401) {
          auth.clearToken();
        }

        return promise.reject(error);
      });
  }

  static getEdgeTypes() {
    const edgeTypes = localStorage.getItem("edgeTypes");
    const edgeTypeExpiry = localStorage.getItem("edgeTypesExpiry");
    if (
      !edgeTypes ||
      (edgeTypes && edgeTypeExpiry && edgeTypeExpiry < Date.now().valueOf()) ||
      !edgeTypeExpiry
    ) {
      return api.loadEdges();
    } else {
      return Promise.resolve(JSON.parse(edgeTypes));
    }
  }
  static loadEdges() {
    return api.get("/schema").then(response => {
      response = jc.retrocycle(response.schema);
      const list = [];
      Object.keys(response).forEach(key => {
        if (
          response[key].inherits.includes("E") &&
          response[key].inherits.includes("OntologyEdge")
        ) {
          list.push({ name: key });
        }
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + 8);

      localStorage.setItem("edgeTypesExpiry", expiry.getTime());
      localStorage.setItem("edgeTypes", JSON.stringify(list));
      return promise.resolve(list);
    });
  }
  static getSources() {
    const sources = localStorage.getItem("sources");
    const sourcesExpiry = localStorage.getItem("sourcesExpiry");
    if (
      !sources ||
      (sources && sourcesExpiry && sourcesExpiry < Date.now().valueOf())
    ) {
      return api.loadSources();
    } else {
      return Promise.resolve(JSON.parse(sources));
    }
  }
  static loadSources() {
    return api.get("/sources").then(response => {
      response = jc.retrocycle(response.result);
      const list = [];
      response.forEach(source => {
        list.push(source);
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + 8);

      localStorage.setItem("sourcesExpiry", expiry.getTime());
      localStorage.setItem("sources", JSON.stringify(list));

      return promise.resolve(list);
    });
  }
}
