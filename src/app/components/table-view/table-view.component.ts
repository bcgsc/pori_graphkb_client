import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { TableViewDataSource, TableViewItem } from './table-view-datasource';
import { APIService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
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
  
  @Input('data') data: TableViewItem[];
  private data2;
  @Output() selected = new EventEmitter<TableViewItem>();
  dataSource: TableViewDataSource;
  private selectedNode;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['class', 'sourceId', 'createdBy', 'name', 'rid-version'];
  
  constructor(private api: APIService) { }

  ngOnInit() {
    this.dataSource = new TableViewDataSource(this.paginator, this.sort, []);
    this.api.getJSON('../../assets/get_diseases.body_expanded.json').subscribe((json) => {
      this.data2 = [];
      json = jc.retrocycle(json);

      json.forEach(element => {

          let entry: TableViewItem = {
            class: element['@class'],
            sourceId: element['sourceId'],
            createdBy: element['createdBy']['name'],
            name: element['name'],
            description: element['description'],
            source: element['source'],
            rid: element['@rid'],
            version: element['@version'],
          }
          this.data2.push(entry);
      });

      this.selectedNode = this.data2[0];
      this.dataSource = new TableViewDataSource(this.paginator, this.sort, this.data2);
    });
  }

  onClick(e, row: TableViewItem) {
    this.selectedNode = row;
  }

  onEdit(edited: TableViewItem){
    // Need api
  }
}
