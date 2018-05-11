import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { TableViewDataSource, TableViewItem } from './table-view-datasource';
import { KBService } from '../../services/kb.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
  providers: [KBService]
})
export class TableViewComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource: TableViewDataSource;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['class', 'sourceId', 'createdBy', 'name', 'rid-version'];
  constructor(private kbservice: KBService, private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.dataSource = new TableViewDataSource(this.paginator, this.sort);

    let dSource = [];

    this.kbservice.getJSON('../../assets/get_diseases.body_expanded.json').subscribe((data) => {
      data.forEach(element => {
        if (!element['$ref']) {
          let createdBy;

          if (element['createdBy']['$ref']) {
            // "$ref": "$[0][\"createdBy\"]"
            let index = element['createdBy']['$ref'].split('[')[1].split(']')[0];
            createdBy = data[index]['createdBy']['name'];
          }
          let entry: TableViewItem = {
            class: element['@class'],
            sourceId: element['sourceId'],
            createdBy: (element['createdBy']['name']) ? element['createdBy']['name'] : createdBy,
            name: element['name'],
            description: element['description'],
            source: element['source'],
            rid: element['@rid'],
            version: element['@version'],
          }
          dSource.push(entry);
        }
      });
      this.dataSource = new TableViewDataSource(this.paginator, this.sort, dSource);

      this.changeDetectorRefs.detectChanges();
    });

  }

  onClick(e, row) {
    console.log('clicked ' + row.name);
  }
}
