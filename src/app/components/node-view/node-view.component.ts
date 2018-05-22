import { Component, OnInit, ViewChild, Input, SimpleChanges } from '@angular/core';
import { DiseaseTerm } from '../../models/models';
import { MatSnackBar } from '@angular/material';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { APIService } from '../../services/api.service';
@Component({
  selector: 'node-view',
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
  providers: [MatSnackBar],
})
export class NodeViewComponent {
  @Input('node') node: DiseaseTerm;
  @Output() changed = new EventEmitter<DiseaseTerm>();
  @Output() added = new EventEmitter<DiseaseTerm>();
  @Output() deleted = new EventEmitter<DiseaseTerm>();

  private _editing = false;
  private _temp: DiseaseTerm;
  private _tempSubset = '';

  constructor(public snackBar: MatSnackBar, private router: Router, private api: APIService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.node || !changes.node.currentValue) return;

    // this.api.getRecord(changes.node.currentValue['@rid'].slice(1), { neighbors: 2 }).subscribe(response => {})

  }

  addChild() {
    this.snackBar.open('Child added!', undefined, { duration: 1000 });
    let params = { 'parentId': this.node['@rid'].slice(1) }
    this.router.navigate(['/add'], { queryParams: params });

  }
  editSelected() {
    this._tempSubset = '';
    let subsets = [];
    if (this.node.subsets) {
      subsets = this.node.subsets.slice();
    }

    this._temp = {
      '@class': this.node['@class'],
      sourceId: this.node.sourceId,
      createdBy: this.node.createdBy,
      name: this.node.name,
      description: this.node.description,
      source: this.node.source,
      '@rid': this.node['@rid'],
      '@version': this.node['@version'],
      subsets: subsets
    }
    this._editing = true;
  }
  deleteSelected() {
    this.deleted.emit(this.node);
  }

  doneEdit() {
    this.node = this._temp;
    this.node['@version']++;
    this.changed.emit(this.node);
    this._editing = false;
  }
  cancelEdit() {
    this._editing = false;
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