import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { APIService } from '../../services/api.service';
import { DiseaseTerm } from '../../models';
import { TableViewDataSource } from './table-view-datasource';
import { NodeViewComponent } from '../node-view/node-view.component';

import * as jc from 'json-cycle';

/**
 * Component for displaying data in a simple table form.
 * @param data input list of disease terms.
 * @param selectedNode application wide selected node object.
 */
@Component({
  selector: 'table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  providers: [APIService]
})
export class TableViewComponent implements OnInit {

  @Input() data;
  @Input() selectedNode;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /**
   * @param selected triggers when the user selects a term from the table.
   */
  @Output() selected = new EventEmitter<DiseaseTerm>();

  private dataSource;

  /* Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid-version', 'source', 'sourceId', 'createdBy', 'name', 'subsets'];

  constructor(private api: APIService) {}

  /**
   * Initializes the table data, pagination, sorting, and filters.
   */
  ngOnInit() {
    // this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    let defaultpredicate = this.dataSource.filterPredicate;

    this.dataSource.filterPredicate = (data:any, filter: string) =>{
      return defaultpredicate(data, filter) || this.subsetsFilter(data, filter);
    }
  }

  /**
   * Applies filter to the subsets column of the table. Returns true if the
   * filter string partially matches any of the subsets of the table entry.
   * @param data a single data object from the table.
   * @param filterStr filter string from the user.
   */
  subsetsFilter(data: any, filterStr: string): boolean {
    if(!data['subsets']) return false;
    
    let result = true;
    let subsets = data['subsets'].map(sub => sub.trim().toLowerCase());

    filterStr.split(',').forEach(filterTerm => { //can make more precise
      let subr = false;
      subsets.forEach(sub => {
        if(sub.indexOf(filterTerm.trim().toLowerCase()) != -1) subr = true;
      })
      if(!subr) result = false;
    });
    return result;
  }

  /**
   * Emits the clicked node to parent component.
   * @param row disease term that was clicked on.
   */
  onClick(row: DiseaseTerm) {
    this.selected.emit(row);
  }

  /**
   * Loads filter string to the datasource to be applied.
   * @param filterStr filter string from user.
   */
  applyFilter(filterStr) {
    this.dataSource.filter = filterStr.trim().toLowerCase();
  }
}
