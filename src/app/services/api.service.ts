import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TableViewItem } from '../components/table-view/table-view-datasource';

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
    public addNode(node): Observable<any> {
        return this.http.post(API_ENDPOINT + "/diseases", node);
    }

    public deleteNode(rid): Observable<any>{
        return this.http.delete(API_ENDPOINT + "/diseases/" + rid);
    }

    public testGetDiseases(): Observable<any> {
        let params = { 'name': 'angiosarcoma' }

        return this.http.get(API_ENDPOINT + "/diseases", { params: params });
    }

    public query(params): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases", { params: params });
    }

    //must be formatted before (get rid of #)
    public getRecord(rid): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases/" + rid);
    }

    public editNode(rid, data:TableViewItem): Observable<any> {
        let payload = {
            name: data.name,
            description: data.description,
            subsets: data.subsets,
        }

        return this.http.patch(API_ENDPOINT + "/diseases/" + rid, payload);
    }
}
