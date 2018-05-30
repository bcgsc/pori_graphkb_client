import { Component } from '@angular/core';
import { APIService } from './services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {  
  constructor(private api: APIService, private router: Router){

  }

  simpleQuery(name){
    this.router.navigate(['/table'], {
      queryParams: {
        name: name,
        ancestors: 'subclassof',
        descendants: 'subclassof',
      }
    });
  }
}
