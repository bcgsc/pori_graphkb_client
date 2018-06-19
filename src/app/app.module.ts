import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatToolbarModule,
  MatProgressSpinnerModule,
  MatButtonModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatGridListModule,
  MatCardModule,
  MatMenuModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatCheckboxModule,
  MatSnackBarModule,
  MatTabsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatTreeModule,
  MatAutocompleteModule,
} from '@angular/material';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import {
  APP_COMPONENTS,
  SHARED_COMPONENTS,
} from './components';

import { APIService, AuthService, APIInterceptor, D3Service, DataService } from './services';
import { SubsetsPipe, SubsetPipe } from './pipes/subsets.pipe';
import { CamelCasePipe } from './pipes/camelCase.pipe';
import { RelationshipPipe } from './pipes/relationship.pipe';

import { D3_DIRECTIVES } from './directives/';

@NgModule({
  declarations: [
    AppComponent,
    ...APP_COMPONENTS,
    ...SHARED_COMPONENTS,
    SubsetsPipe,
    SubsetPipe,
    CamelCasePipe,
    RelationshipPipe,
    ...D3_DIRECTIVES,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    HttpClientModule,
    MatSnackBarModule,
    FormsModule,
    AppRoutingModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTreeModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  providers: [
    APIService,
    AuthService,
    DataService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: APIInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
