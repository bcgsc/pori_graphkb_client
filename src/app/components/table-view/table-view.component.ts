import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { APIService } from '../../services/api.service';

import { TableViewDataSource, TableViewItem } from './table-view-datasource';
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

  @Output() selected = new EventEmitter<TableViewItem>();
  
  @Input() data;
  dataSource: TableViewDataSource;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid-version', 'source', 'sourceId', 'createdBy', 'name', 'subsets'];
  
  constructor(private api: APIService) { 
  }

  ngOnInit() {
    this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);    
  }

  ngAfterViewInit(): void {
  }

  onClick(e, row: TableViewItem) {
    this.selected.emit(row);
  }

  onEdit(edited: TableViewItem){
  }
  onAdded(added: TableViewItem){
  }
  onDeleted(deleted: TableViewItem){
  }

  refresh(){
    this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
  }
}
