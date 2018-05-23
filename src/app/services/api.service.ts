import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiseaseTerm } from '../models/models';

const API_ENDPOINT = "http://10.9.202.242:8088/api";
/**
 * Service for configuring HTTP requests (payloads, API endpoints, etc)
 */
@Injectable()
export class APIService {
    private _terms: {[id:string]: DiseaseTerm};
    private _list: string[];

    get terms(): DiseaseTerm[]{
        return this._list.map(id => this._terms[id]);
    }

    constructor(private http: HttpClient) {}

    public addNode(node): Observable<any> {
        return this.http.post(API_ENDPOINT + "/diseases", node);
    }

    public deleteNode(rid): Observable<any> {
        return this.http.delete(API_ENDPOINT + "/diseases/" + rid);
    }

    public query(params): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases", { params: params });
    }

    //must be formatted before (get rid of #)
    public getRecord(rid, params?): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases/" + rid, {params: params});
    }

    // Configure add relationship calls
    public editNode(rid, data: DiseaseTerm): Observable<any> {
        let payload = {
            name: data.name,
            description: data.description,
            subsets: data.subsets,
        }

        return this.http.patch(API_ENDPOINT + "/diseases/" + rid, payload);
    }

    public addRelationship(input): Observable<any>{
        let classEndpoint = input.type;
        let payload = {
            in: input.in,
            out: input.out,
        }

        return this.http.post(API_ENDPOINT + "/" + classEndpoint, payload);
    }
}
