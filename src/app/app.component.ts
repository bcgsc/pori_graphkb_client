import { Component, OnInit } from '@angular/core';
import { APIService } from './services';
import { Router } from '@angular/router';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private api: APIService, private router: Router) {
  }

  simpleQuery(name) {
    this.router.navigate(['/results'], {
      queryParams: {
        name: name,
        ancestors: 'subclassof',
        descendants: 'subclassof',
      }
    });
  }
}
