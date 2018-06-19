import { Component, ViewChild, HostBinding, ViewEncapsulation } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { Ontology, GraphLink, GraphNode } from '../../models';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { TableViewComponent } from '../table-view/table-view.component';
import { NodeViewComponent } from '../node-view/node-view.component';
import { Edge } from '../add-node-view/add-node-view.component';
import { TreeViewComponent } from '../tree-view/tree-view.component';
import { DataService } from '../../services';
import { Subscription } from 'rxjs';

/**
 * Component that handles all communication with the server, and allocating of
 * data objects to the different child components. Defines the layout of the 
 * different data views.
 */
@Component({
  selector: 'browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss'],
})
export class BrowseComponent {
  private sources = [
    'disease ontology',
    'oncotree',
    'ncit',
    'ontology1',
    'ontology2',
  ]
}

