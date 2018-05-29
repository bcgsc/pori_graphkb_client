import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiseaseTerm, DiseasePayload, DiseaseParams } from '../models';
import { Edge } from '../components/add-node-view/add-node-view.component';

const API_ENDPOINT = "http://10.9.202.242:8088/api";
/**
 * Service for configuring HTTP requests (payloads, API endpoints, etc) to the
 * Knowledge Base server.
 */
@Injectable()
export class APIService {
    private _terms: {[id:string]: DiseaseTerm};
    private _list: string[];

    get terms(): DiseaseTerm[]{
        return this._list.map(id => this._terms[id]);
    }

    constructor(private http: HttpClient) {}

    /**
     * POST's a new disease term to the server.
     * @param node disease term payload.
     */
    public addNode(node: DiseasePayload): Observable<any> {
        return this.http.post(API_ENDPOINT + "/diseases", node);
    }

    /**
     * DELETE's a disease term off the server.
     * @param rid target disease term RID.
     */
    public deleteNode(rid: string): Observable<any> {
        return this.http.delete(API_ENDPOINT + "/diseases/" + rid);
    }

    /**
     * Queries the server with input parameters.
     * @param params map of disease term parameters.
     */
    public query(params): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases", { params: params });
    }

    //must be formatted before (get rid of #)

    /**
     * Gets a term from it's own endpoint on the server, with optional
     * additional parameters
     * @param rid target disease term's RID.
     * @param params optional additional query parameters.
     */
    public getRecord(rid, params?): Observable<any> {
        return this.http.get(API_ENDPOINT + "/diseases/" + rid, {params: params});
    }

    // Configure add relationship calls

    /**
     * PATCHes a disease term's endpoint with the input payload.
     * @param rid target term's RID.
     * @param data payload containing new data to be patched.
     */
    public editNode(rid, data: DiseaseTerm): Observable<any> {
        let payload = {
            name: data.name,
            description: data.description,
            subsets: data.subsets,
        }

        return this.http.patch(API_ENDPOINT + "/diseases/" + rid, payload);
    }

    /**
     * POST's a new relationship to the database.
     * @param input edge object containing in/out points, as well as edge type.
     */
    public addRelationship(input: Edge): Observable<any>{
        let classEndpoint = input.type;
        let payload = {
            in: input.in,
            out: input.out,
        }

        return this.http.post(API_ENDPOINT + "/" + classEndpoint, payload);
    }
}
