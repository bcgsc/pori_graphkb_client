import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { APIService } from '../../services/api.service';
import { DiseaseTerm } from '../../models';
import { TableViewDataSource } from './table-view-datasource';
import { NodeViewComponent } from '../node-view/node-view.component';

import * as jc from 'json-cycle';

@Component({
  selector: 'table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  providers: [APIService]
})
export class TableViewComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Output() selected = new EventEmitter<DiseaseTerm>();

  @Input() data;
  @Input() initSelected?;
  dataSource;

  private selectedNode;

  /* Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid-version', 'source', 'sourceId', 'createdBy', 'name', 'subsets'];

  constructor(private api: APIService) {
  }

  ngOnInit() {
    // this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.selectedNode = this.initSelected || this.data[0];
    let defaultpredicate = this.dataSource.filterPredicate;

    this.dataSource.filterPredicate = (data:any, filter: string) =>{
      return defaultpredicate(data, filter)|| this.subsetsFilter(data, filter);
    }
  }

  subsetsFilter(data: any, filter: string): boolean {
    let result = true;
    let subsets = [];
    
    data['subsets'].forEach(sub => subsets.push(sub.trim().toLowerCase()));

    filter.split(',').forEach(subset => {
      if (subset && !(subsets.includes(subset.trim().toLowerCase()))) result = false;
    });
    return result;
  }

  onClick(e, row: DiseaseTerm) {
    // this.selected.emit(row['@rid'].slice(1));
    this.selected.emit(row);

    this.selectedNode = row;
  }

  applyFilter(filter) {
    this.dataSource.filter = filter.trim().toLowerCase();
  }

  onEdit(edited: DiseaseTerm) {
  }
  onAdded(added: DiseaseTerm) {
  }
  onDeleted(deleted: DiseaseTerm) {
  }
}
