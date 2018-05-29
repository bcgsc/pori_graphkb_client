import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

const AUTH_ENDPOINT = 'bcgsc/api/authenticate';
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXIiOnsibmFtZSI6ImFkbWluIiwiQHJpZCI6IiM0MTowIn19LCJpYXQiOjE1MjY0MzIwMjF9.iUSZphrn7zFL6ZXrEt39SuIfyVFQqG3c6xYtM4aNvyM";

/**
 * Service for handling user authentication.
 */
@Injectable()
export class AuthService {

    constructor(private http: HttpClient) {
        this.loadToken(TEST_TOKEN);
    }

    /**
     * POST's user credentials to server, and loads token if provided by the 
     * server.
     */
    public login(username: string, password: string): void {
        this.http.post(AUTH_ENDPOINT, { 
            username: username, 
            password: password 
        }).subscribe((token: string) => this.loadToken(token));
    }

    /**
     * Getter for the the token.
     */
    public getToken(): string {
        return localStorage.getItem('token');
    }

    /**
     * Clears token from localstorage.
     */
    public clearToken(): void {
        localStorage.removeItem('token');
    }
    /**
     * Loads token into localstorage.
     * @param token JWT token.
     */
    public loadToken(token: string): void {
        localStorage.setItem('token', token);
    }
}