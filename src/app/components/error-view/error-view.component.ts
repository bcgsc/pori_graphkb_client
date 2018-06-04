import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'error-view',
    templateUrl: './error-view.component.html',
    styleUrls: ['./error-view.component.scss']
})
export class ErrorViewComponent {
    
    constructor(private router: Router){}
    
    back(){
        this.router.navigateByUrl('/query');
    }
}
