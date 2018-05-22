import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { APIService } from '../../services/api.service';
import { DiseaseTerm } from '../../models/models';
import { TableViewDataSource } from './table-view-datasource';
import { NodeViewComponent } from '../node-view/node-view.component';

import * as jc from 'json-cycle';

@Component({
  selector: 'table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  providers: [APIService]
})
export class TableViewComponent implements OnInit, AfterViewInit {
 
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Output() selected = new EventEmitter<DiseaseTerm>();
  
  @Input() data;
  @Input() initSelected?;
  dataSource: TableViewDataSource;

  private selectedNode;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid-version', 'source', 'sourceId', 'createdBy', 'name', 'subsets'];
  
  constructor(private api: APIService) { 
  }

  ngOnInit() {
    this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
    this.selectedNode = this.initSelected || this.data[0];
  }

  ngAfterViewInit(): void {
  }

  onClick(e, row: DiseaseTerm) {
    // this.selected.emit(row['@rid'].slice(1));
    this.selected.emit(row);
    
    this.selectedNode = row;
  }

  onEdit(edited: DiseaseTerm){
  }
  onAdded(added: DiseaseTerm){
  }
  onDeleted(deleted: DiseaseTerm){
  }
}
