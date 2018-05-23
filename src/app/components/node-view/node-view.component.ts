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
  @Output() deleted = new EventEmitter<string>();

  private _editing = false;
  private _temp: DiseaseTerm;
  private _tempSubset = '';
  private init;

  constructor(public snackBar: MatSnackBar, private router: Router, private api: APIService) { }

  ngOnChanges(changes: SimpleChanges) {
    this._editing = false;
    this._temp = undefined;
    this._tempSubset = '';
    if (!changes.node || !changes.node.currentValue) return;
    this.init = changes.node.currentValue;
    // this.api.getRecord(changes.node.currentValue['@rid'].slice(1), { neighbors: 2 }).subscribe(response => {})
  }

  /**
   * Navigates to Add Node page and initializes form with 1 edge connecting 
   * this node as parent
   */
  private addChild() {
    // this.snackBar.open('Child added!', undefined, { duration: 1000 });
    let params = { 'parentId': this.node['@rid'].slice(1) }
    this.router.navigate(['/add'], { queryParams: params });
  }

  /**
   * Takes all changes and sends a PATCH request to the server. Emits change to
   * parent component
   */
  private applyChanges() {
    if(this._tempSubset) this._temp.subsets.push(this._tempSubset);
    this.node = this._temp;
    this.changed.emit(this.node);
  }

  /**
   * Sends a DELETE request to the server. 
   */
  private deleteSelected() {
    this.deleted.emit(this.node['@rid']);
  }

  /**
   * Navigates to the general query endpoint, specifying only this node's 
   * source as a query parameter.
   */
  private queryBySource(){
    let params = {source: this.node.source};
    this.router.navigate(['/table'], {queryParams: params});

  }

  /* Helper Methods */
  
  private beginEdit() {
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

  private cancelEdit() {
    this._editing = false;
  }

  private addTempSubset() {
    if(!this._tempSubset) return;
    this._temp.subsets.push(this._tempSubset);
    this._tempSubset = '';
  }

  private deleteTempSubset(subset): void {
    let i = this._temp.subsets.findIndex(s => subset == s);
    this._temp.subsets.splice(i, 1);
  }
}
