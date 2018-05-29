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
import { Router } from '@angular/router';

/**
 * Interceptor for authentication and response handling.
 */
@Injectable()
export class APIInterceptor implements HttpInterceptor {
    constructor(public auth: AuthService, private router: Router) { }

    /**
     * Injects outgoing http requests with an authorization header if able, and 
     * handles response error codes 404 and 401.
     * @param request outgoing http request.
     * @param next http handler.
     */
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Add authorization header if token exists
        if (this.auth.getToken()) {
            request = request.clone({
                setHeaders: {
                    Authorization: this.auth.getToken(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
                    'Access-Control-Allow-Headers': 'content-type',
                }
            });
        }

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
                }
                if(err.status === 404){
                    this.router.navigate(['/query']);
                }
            };
        });
    }
}