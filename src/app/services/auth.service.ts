import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

const AUTH_ENDPOINT = 'bcgsc/api/authenticate';
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXIiOnsibmFtZSI6ImFkbWluIiwiQHJpZCI6IiM0MTowIn19LCJpYXQiOjE1MjY0MzIwMjF9.iUSZphrn7zFL6ZXrEt39SuIfyVFQqG3c6xYtM4aNvyM";

@Injectable()
export class AuthService {

    constructor(private http: HttpClient) {
        this.loadToken(TEST_TOKEN);
    }

    public login(username: string, password: string): void {
        this.http.post(AUTH_ENDPOINT, { 
            username: username, 
            password: password 
        }).subscribe((token: string) => this.loadToken(token));
    }

    public getToken(): string {
        return localStorage.getItem('token');
    }
    public clearToken(): void {
        localStorage.removeItem('token');
    }
    public loadToken(token: string): void {
        localStorage.setItem('token', token);
    }
}