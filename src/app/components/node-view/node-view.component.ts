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

  constructor(public snackBar: MatSnackBar) { }

  addChild() {
    this.snackBar.open('Child added!', undefined, { duration: 1000 });
  }
  editSelected() {
    this.enterEdit();
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

  enterEdit() {
    this._temp = {
      class: this.node.class,
      sourceId: this.node.sourceId,
      createdBy: this.node.createdBy,
      name: this.node.name,
      description: this.node.description,
      source: this.node.source,
      rid: this.node.rid,
      version: this.node.version,
      subsets: this.node.subsets
    }
  }

  recall() {
    this.node = this._temp;
  }

}