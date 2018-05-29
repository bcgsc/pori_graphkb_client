import { Component, OnInit, ViewChild, Input, SimpleChanges } from '@angular/core';
import { DiseaseTerm } from '../../models';
import { MatSnackBar } from '@angular/material';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { APIService } from '../../services/api.service';
import { Edge } from '../add-node-view/add-node-view.component';

/**
 * Component to view a single node of data. Displays the node's basic fields, 
 * as well as all of its edges, in list form. Allows editing, deleting, and 
 * adding children to the selected node. Must have a parent component with 
 * proper event handlers.
 * 
 * @param node selected node for displaying in this component.
 */
@Component({
  selector: 'node-view',
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
  providers: [MatSnackBar],
})
export class NodeViewComponent {
  @Input() node: DiseaseTerm;

  /**
   * @param changed triggers when changes to the selected node have been 
   * committed by client.
   * @param added triggers when the client adds a new child node to the 
   * selected node.
   * @param deleted triggers when client deletes selected node.
   * @param relationshipped triggers when the client adds a new relationship
   * to the selected node.
   * @param query triggers when the client queries the selected node's source
   * or neighbors.
   */
  @Output() changed = new EventEmitter<DiseaseTerm>();
  @Output() added = new EventEmitter<DiseaseTerm>();
  @Output() deleted = new EventEmitter<DiseaseTerm>();
  @Output() relationshipped = new EventEmitter<Edge>();
  @Output() query = new EventEmitter<any>();

  private _editing = false;
  private _temp: DiseaseTerm;
  private _tempSubset = '';
  private _tempParent = '';
  private _tempChild = '';
  private _tempAlias = '';

  private init: DiseaseTerm;

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
   * this selected node as parent
   */
  private addChild() {
    // this.snackBar.open('Child added!', undefined, { duration: 1000 });
    let params = { 'parentId': this.node['@rid'].slice(1) }
    this.router.navigate(['/add'], { queryParams: params });
  }

  /**
   * Takes all changes (fields and edges) and emits them to parent component.
   */
  private applyChanges() {
    if (this._tempSubset) this._temp.subsets.push(this._tempSubset);

    this._temp.parents.forEach(p => {
      if (!this.node.parents || !this.node.parents.includes(p)) {
        let edge: Edge = {
          type: 'subclassof',
          in: p,
          out: this.node['@rid'],
        }
        this.relationshipped.emit(edge);
      }
    });

    this._temp.children.forEach(c => {
      if (!this.node.children || !this.node.children.includes(c)) {
        let edge: Edge = {
          type: 'subclassof',
          in: this.node['@rid'],
          out: c,
        }
        this.relationshipped.emit(edge);
      }
    });

    this._temp.aliases.forEach(a => {
      if (!this.node.aliases || !this.node.aliases.includes(a)) {
        let edge: Edge = {
          type: 'aliasof',
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
   * Emits a signal to parent component to delete this selected node.
   */
  private deleteSelected(node) {
    this.deleted.emit(this.node);
  }

  /**
   * Navigates to the general query endpoint, specifying only this node's 
   * source as a query parameter. This will change the query results to
   * those of a source query.
   */
  private queryBySource() {
    let params = { source: this.node.source };
    this.router.navigate(['/table'], { queryParams: params });
    this.query.emit(params);

  }


  /**
   * Initializes temp variables for making edits to selected node.
   */
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

  /**
   * Sets editing state to false, changing the view accordingly.
   */
  private cancelEdit() {
    this._editing = false;
  }

  /**
   * Adds an entry to the temporary subset list.
   */
  private addTempSubset() {
    if (!this._tempSubset) return;
    this._temp.subsets.push(this._tempSubset);
    this._tempSubset = '';
  }

  /**
   * Deletes a subset entry from the temporary subset list.
   * @param subset subset entry to be deleted from the temporary list.
   */
  private deleteTempSubset(subset: string): void {
    let i = this._temp.subsets.findIndex(s => subset == s);
    this._temp.subsets.splice(i, 1);
  }

  /**
   * Adds an entry to the temporary parent list.
   */
  private addTempParent() {
    if (!this._tempParent) return;
    this._temp.parents.push(this._tempParent);
    this._tempParent = '';
  }

  /**
   * Deletes a parent entry from the temporary parent list.
   * @param parent parent entry to be deleted from the temporary parent list.
   */
  private deleteTempParent(parent: string): void {
    let i = this._temp.parents.findIndex(s => parent == s);
    this._temp.parents.splice(i, 1);
  }

  /**
   * Adds an entry to the temporary child list.
   */
  private addTempChild() {
    if (!this._tempChild) return;
    this._temp.children.push(this._tempChild);
    this._tempChild = '';
  }

  /**
   * Deletes a child entry from the temporary child list.
   * @param child child entry to be deleted from the temporary child list.
   */
  private deleteTempChild(child: string): void {
    let i = this._temp.children.findIndex(s => child == s);
    this._temp.children.splice(i, 1);
  }

  /**
   * Adds an alias entry to the temporary alias list.
   */
  private addTempAlias() {
    if (!this._tempAlias) return;
    this._temp.aliases.push(this._tempAlias);
    this._tempAlias = '';
  }
  /**
   * Deletes an alias entry from the temporary alias list.
   * @param alias alias entry to be deleted from the temporary alias list.
   */
  private deleteTempAlias(alias: string): void {
    let i = this._temp.aliases.findIndex(s => alias == s);
    this._temp.aliases.splice(i, 1);
  }

  /**
   * Queries the database for the RID specified, then refreshes the view.
   * @param rid rid to be queried
   */
  private search(rid) {
    //TODO: check if it's in datamap, o.w. make a new api call.

    let params = { ancestors: 'subclassof', descendants: 'subclassof' };
    this.router.navigate(['/table/' + rid], { queryParams: params });
    this.query.emit({ params: params, rid: rid });
  }

}
