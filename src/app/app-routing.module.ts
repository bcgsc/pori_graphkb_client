import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DataHubComponent } from './components/data-hub/data-hub.component';
import { QueryViewComponent } from './components/query-view/query-view.component';
import { AddNodeViewComponent } from './components/add-node-view/add-node-view.component';

const routes: Routes = [
  { path: 'table', component: DataHubComponent },
  { path: 'table/:rid', component: DataHubComponent },  
  { path: 'query', component: QueryViewComponent },
  { path: 'add', component: AddNodeViewComponent },  
  { path: '', redirectTo: '/table', pathMatch: 'full' },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
