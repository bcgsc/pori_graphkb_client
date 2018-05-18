import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { TableViewItem } from '../table-view/table-view-datasource';
import { MatSnackBar } from '@angular/material';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
@Component({
  selector: 'node-view',
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
  providers: [MatSnackBar],
})
export class NodeViewComponent {
  @Input('node') node: TableViewItem;
  @Output() changed = new EventEmitter<TableViewItem>();
  @Output() added = new EventEmitter<TableViewItem>();
  @Output() deleted = new EventEmitter<TableViewItem>();

  private _editing = false;
  private _temp: TableViewItem;
  private _tempSubset = '';

  constructor(public snackBar: MatSnackBar) { }

  addChild() {
    this.snackBar.open('Child added!', undefined, { duration: 1000 });
  }
  editSelected() {
    this._tempSubset = '';
    let subsets = [];
    if (this.node.subsets) {
      subsets = this.node.subsets.slice();
    }

    this._temp = {
      class: this.node.class,
      sourceId: this.node.sourceId,
      createdBy: this.node.createdBy,
      name: this.node.name,
      description: this.node.description,
      source: this.node.source,
      rid: this.node.rid,
      version: this.node.version,
      subsets: subsets
    }
    this._editing = true;
  }
  deleteSelected() {
    this.snackBar.open('Goodbye!', undefined, { duration: 1000 });
  }
  doneEdit() {
    console.log(this._temp);
    this.recall();
    this.node.version++;
    this.changed.emit(this.node);
    this._editing = false;

  }
  cancelEdit() {
    this._editing = false;
  }

  recall() {
    this.node = this._temp;
  }

  addTempSubset() {
    this._temp.subsets.push(this._tempSubset);
    this._tempSubset = '';
  }

  deleteTempSubset(subset): void {
    let i = this._temp.subsets.findIndex(s => subset == s);
    this._temp.subsets.splice(i, 1);
  }

}