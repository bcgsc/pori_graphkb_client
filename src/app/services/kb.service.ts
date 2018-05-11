import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Development service for pulling dummy (test) data from a JSON file
 */
@Injectable()
export class KBService {
    constructor(private http: Http) {}

    public getJSON(url: string): Observable<any> {
        return this.http.get(url)
            .pipe(map(data => data.json(), error => console.error(error)));
    }
}
