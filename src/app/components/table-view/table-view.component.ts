import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { TableViewDataSource, TableViewItem } from './table-view-datasource';
import { APIService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  providers: [APIService]
})
export class TableViewComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  @Input('data') data: TableViewItem[];
  @Output() selected = new EventEmitter<TableViewItem>();
  dataSource: TableViewDataSource;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['class', 'sourceId', 'createdBy', 'name', 'rid-version'];
  
  constructor() { }

  ngOnInit() {
    this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data);
  }

  onClick(e, row: TableViewItem) {
      this.selected.emit(row);

  }
}
