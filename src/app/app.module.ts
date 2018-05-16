import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule, MatListModule, MatGridListModule, MatCardModule, MatMenuModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCheckboxModule } from '@angular/material';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatTabsModule} from '@angular/material/tabs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

import { AppComponent } from './app.component';
import { NodeViewComponent } from './components/node-view/node-view.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { TreeViewComponent } from './components/tree-view/tree-view.component';
import { DataHubComponent } from './components/data-hub/data-hub.component';
import { QueryViewComponent } from './components/query-view/query-view.component';

import { APIService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APIInterceptor } from './services/api.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { SubsetsPipe } from'./pipes/subsets.pipe';
import { CamelCasePipe } from './pipes/camelCase.pipe';

@NgModule({
  declarations: [
    AppComponent,
    TableViewComponent,
    NodeViewComponent,
    TreeViewComponent,
    DataHubComponent,
    QueryViewComponent,
    SubsetsPipe,
    CamelCasePipe
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
    MatCheckboxModule
  ],
  providers: [
    APIService, 
    AuthService, 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: APIInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
