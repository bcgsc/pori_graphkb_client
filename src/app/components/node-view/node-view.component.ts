import { Component, OnInit, ViewChild, Input, SimpleChanges } from '@angular/core';
import { DiseaseTerm } from '../../models';
import { MatSnackBar } from '@angular/material';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { APIService } from '../../services/api.service';
import { Edge } from '../add-node-view/add-node-view.component';
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
  @Output() relationshipped = new EventEmitter<Edge>();

  @Output() sourceQuery = new EventEmitter<any>();

  private _editing = false;
  private _temp: DiseaseTerm;
  private _tempSubset = '';
  private _tempParent = '';
  private _tempChild = '';
  private _tempAlias = '';
  
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
    if (this._tempSubset) this._temp.subsets.push(this._tempSubset);
    
    this._temp.parents.forEach(p => {
      if (!this.node.parents || !this.node.parents.includes(p)){
        let edge: Edge = {
          type:'subclassof',
          in: p,
          out:this.node['@rid'], 
        }
        this.relationshipped.emit(edge);
      } 
    });

    this._temp.children.forEach(c => {
      if (!this.node.children || !this.node.children.includes(c)){
        let edge: Edge = {
          type:'subclassof',
          in: this.node['@rid'], 
          out: c,          
        }
        this.relationshipped.emit(edge);
      } 
    });

    this._temp.aliases.forEach(a => {
      if (!this.node.aliases || !this.node.aliases.includes(a)){
        let edge: Edge = {
          type:'aliasof',
          in: this.node['@rid'], 
          out: a,          
        }
        this.relationshipped.emit(edge);
      } 
    });

    this.node = this._temp;
    this.changed.emit(this.node);
  }

  /**
   * Sends a DELETE request to the server. 
   */
  private deleteSelected(node) {
    this.deleted.emit(this.node);
  }

  /**
   * Navigates to the general query endpoint, specifying only this node's 
   * source as a query parameter.
   */
  private queryBySource() {
    let params = { source: this.node.source };
    this.router.navigate(['/table'], { queryParams: params });
    this.sourceQuery.emit(params);

  }

  /* Helper Methods */

  private beginEdit() {
    this._tempSubset = '';

    let subsets = this.node.subsets ? this.node.subsets.slice() : [];
    let parents = this.node.parents ? this.node.parents.slice() : [];
    let children = this.node.children ? this.node.children.slice() : [];
    let aliases = this.node.aliases ? this.node.aliases.slice() : [];    

    this._temp = {
      '@class': this.node['@class'],
      sourceId: this.node.sourceId,
      createdBy: this.node.createdBy,
      name: this.node.name,
      description: this.node.description,
      source: this.node.source,
      '@rid': this.node['@rid'],
      '@version': this.node['@version'],
      subsets: subsets,
      parents: parents,
      children: children,
      aliases: aliases,
    }
    this._editing = true;
  }

  private cancelEdit() {
    this._editing = false;
  }

  private addTempSubset() {
    if (!this._tempSubset) return;
    this._temp.subsets.push(this._tempSubset);
    this._tempSubset = '';
  }

  private deleteTempSubset(subset): void {
    let i = this._temp.subsets.findIndex(s => subset == s);
    this._temp.subsets.splice(i, 1);
  }


  private addTempParent() {
    if (!this._tempParent) return;
    this._temp.parents.push(this._tempParent);
    this._tempParent = '';
  }

  private deleteTempParent(subset): void {
    let i = this._temp.parents.findIndex(s => subset == s);
    this._temp.parents.splice(i, 1);
  }


  private addTempChild() {
    if (!this._tempSubset) return;
    this._temp.children.push(this._tempSubset);
    this._tempSubset = '';
  }

  private deleteTempChild(subset): void {
    let i = this._temp.children.findIndex(s => subset == s);
    this._temp.children.splice(i, 1);
  }


  private addTempAlias() {
    if (!this._tempAlias) return;
    this._temp.aliases.push(this._tempAlias);
    this._tempAlias = '';
  }

  private deleteTempAlias(subset): void {
    let i = this._temp.aliases.findIndex(s => subset == s);
    this._temp.aliases.splice(i, 1);
  }

  private search(rid){
    console.log(rid);
  }
}
