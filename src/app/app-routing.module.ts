import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TableViewComponent } from './components/table-view/table-view.component';
//TODO: add home view component (migrate)
const routes: Routes = [
  { path: 'table', component: TableViewComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
