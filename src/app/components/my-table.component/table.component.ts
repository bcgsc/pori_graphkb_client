import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { APIService } from '../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import * as jc from 'json-cycle';
import { DiseaseTerm } from '../../models';

@Component({
  selector: 'my-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [APIService]
})
export class MyTableComponent implements OnInit {
  private _data: DiseaseTerm[];
  @Input() data: DiseaseTerm[];
  @Input() initSelected?;  
  @Output() selected = new EventEmitter<DiseaseTerm>();

  private selectedNode;
  loading = false;
  total = 0;
  page = 1;
  limit = 20;

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['rid-version', 'sourceId', 'createdBy', 'name', 'subsets'];

  constructor(private api: APIService) { }

  ngOnInit() {
    this.initData();
  }

  initData(): void {
    this.total = this.data.length;
    this._data = this.data.slice(0, this.limit + 1);
  }

  refreshData(): void {
    let i = (this.page - 1) * (this.limit);
    let f = Math.min((this.page) * (this.limit), this.total);

    this._data = this.data.slice(i, f);
  }

  // Pagination methods
  goToPage(n: number): void {
    this.page = n;
    this.refreshData();
  }

  onNext(): void {
    this.page++;
    this.refreshData();
  }
  onPrev(): void {
    this.page--;
    this.refreshData();
  }

  // Node editing methods

  onClick(e, row: DiseaseTerm) {
    this.selectedNode = row;
    this.selected.emit(row);
  }

  onEdit(edited: DiseaseTerm) {
  }

  onAdded(added: DiseaseTerm) {
  }

  onDeleted(deleted: DiseaseTerm) {
  }
}

