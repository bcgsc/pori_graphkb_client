import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

const AUTH_ENDPOINT = 'bcgsc/api/authenticate';
@Injectable()
export class AuthService {

    constructor(private http: HttpClient) { }

    public login(username: string, password: string): void {
        this.http.post(AUTH_ENDPOINT, { username: username, password: password }).subscribe();
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