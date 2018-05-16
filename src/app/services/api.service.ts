import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


const API_ENDPOINT = "http://10.9.202.242:8088/api";
/**
 * Service for configuring HTTP requests (payloads, API endpoints, etc)
 */
@Injectable()
export class APIService {
    constructor(private http: HttpClient) { }

    public getJSON(url: string): Observable<any> {
        return this.http.get(url);
    }

    public testGetDiseases(): Observable<any>{
        let params = {name: 'angiosarcoma'}
        
        return this.http.get(API_ENDPOINT + "/diseases", {params: params});
    }
}
