import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service for configuring HTTP requests (payloads, API endpoints, etc)
 */
@Injectable()
export class APIService {
    constructor(private http: HttpClient) { }

    public getJSON(url: string): Observable<any> {
        return this.http.get(url);
    }
}
