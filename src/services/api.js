import axios from 'axios';
import promise from 'promise';
import * as jc from 'json-cycle';

const API_BASE_URL = 'http://kbapi01:8088/api';
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXIiOnsibmFtZSI6ImFkbWluIiwiQHJpZCI6IiM0MTowIn19LCJpYXQiOjE1MjY0MzIwMjF9.iUSZphrn7zFL6ZXrEt39SuIfyVFQqG3c6xYtM4aNvyM";

var api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Authorization: TEST_TOKEN,
        'Content-type': 'application/json',
    },
});

function getToken() {
    return 0;
}

api.interceptors.request.use((config) => {
    // get access token from whatever...
    let token = getToken() //another service?
    if (token) {
        if (config.method !== 'OPTIONS') {
            config.headers.Authorization = token;
        }
    }
    console.log(config)
    config.headers.Authorization = TEST_TOKEN;

    return config;
}, (error) => {
    //something with error...
    return promise.reject(error);
});

api.interceptors.response.use((response) => {
    console.log(response);
    return jc.retrocycle(response.data);
}, (error) => {
    return promise.reject(error);
})

export default api;
