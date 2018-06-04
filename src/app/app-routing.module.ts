import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DataHubComponent } from './components/data-hub/data-hub.component';
import { QueryViewComponent } from './components/query-view/query-view.component';
import { AddNodeViewComponent } from './components/add-node-view/add-node-view.component';
import { ErrorViewComponent } from './components/error-view/error-view.component';

const routes: Routes = [
  { path: 'results', component: DataHubComponent },
  { path: 'results/:rid', component: DataHubComponent },  
  { path: 'query', component: QueryViewComponent },
  { path: 'add', component: AddNodeViewComponent },
  { path: 'error', component: ErrorViewComponent },
  { path: '', redirectTo: '/query', pathMatch: 'full' },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
