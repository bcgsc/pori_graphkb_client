import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpErrorResponse,
    HttpResponse,
    HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/do';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Interceptor for authentication and responses
 */
@Injectable()
export class APIInterceptor implements HttpInterceptor {
    constructor(public auth: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Add authorization header if token exists
        if (this.auth.getToken()) {
            request = request.clone({
                setHeaders: {
                    Authorization: this.auth.getToken(),
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT, PATCH'
                }
            });
        }
        console.log(request);        

        return next.handle(request).do((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
                let token = event && event.body.token;

                if (token) {
                    this.auth.loadToken(token);
                }
            }
        }, (err: any) => {
            if (err instanceof HttpErrorResponse) {
                if (err.status === 401) {
                    this.auth.clearToken();
                    // redirect to the login route
                    // or show a modal
                }
                console.log(err);
            };
        });
    }
}