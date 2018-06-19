import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterViewInit, SimpleChanges } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { APIService } from '../../services/api.service';
import { Ontology } from '../../models';
import { NodeViewComponent } from '../node-view/node-view.component';

import * as jc from 'json-cycle';
import { Observable } from 'rxjs';

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
export class TableViewComponent {

  @Input() data;
  @Input() selectedNode;
  @Input() updated;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /**
   * @param selected triggers when the user selects a term from the table.
   */
  @Output() selected = new EventEmitter<string>();

  private dataSource;

  /* Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid', 'source', 'sourceId', 'createdBy', 'name', 'subsets'];

  constructor(private api: APIService) {


  }
  ngOnInit() {
    // this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = this.sortData;
    let defaultpredicate = this.dataSource.filterPredicate;

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return defaultpredicate(data, filter) || this.subsetsFilter(data, filter);
    }
    // this.updated.subscribe(() => this.dataSource.data = this.data);
  }
  /**
   * Applies filter to the subsets column of the table. Returns true if the
   * filter string partially matches any of the subsets of the table entry.
   * @param data a single data object from the table.
   * @param filterStr filter string from the user.
   */
  subsetsFilter(data: any, filterStr: string): boolean {
    if (!data['subsets']) return false;

    let subsets = data['subsets'].map(subset => {
      let concat = '';
      let subName: string = subset.split('#').slice(1).toString() || subset;
      let s = subName.split('_') || [subName];

      s.forEach(word => {
        concat += word + " ";
      });

      return concat.toLowerCase().trim();
    });

    let result = true;

    filterStr.split(',').forEach(filterTerm => { //can make more precise
      let m = false;
      subsets.forEach(sub => {
        if (sub.indexOf(filterTerm.trim().toLowerCase()) != -1) m = true;
      })
      if (!m) result = false;
    });
    return result;
  }

  sortData(data, active) {
    switch (active) {
      case 'class': return data['@class'];
      case 'sourceId': return data.sourceId;
      case 'createdBy': return data.createdBy;
      case 'name': return data.name;
      case 'rid':
        let a = data['@rid'].split(':')[0].slice(1) * 10000 + parseInt(data['@rid'].split(':')[1]);
        return a;
      case 'subsets':
        if (!data.subsets) return '';

        return data.subsets.toString();

      default: return 0;
    }
  }

  /**
   * Emits the clicked node to parent component.
   * @param row disease term that was clicked on.
   */
  onClick(row: Ontology) {
    this.selected.emit(row["@rid"]);
  }

  /**
   * Loads filter string to the datasource to be applied.
   * @param filterStr filter string from user.
   */
  applyFilter(filterStr) {
    this.dataSource.filter = filterStr.trim().toLowerCase();
  }
}
