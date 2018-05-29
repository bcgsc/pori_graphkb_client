import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { DiseaseTerm } from '../../models';

@Component({
  selector: 'tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  providers: []
})
export class TreeViewComponent implements OnInit {

  treeControl: FlatTreeControl<DiseaseTerm>;
  treeFlattener: MatTreeFlattener<DiseaseTerm, any>;
  dataSource: MatTreeFlatDataSource<DiseaseTerm, any>;

  @Input() data: DiseaseTerm[];
  @Input() selectedNode: DiseaseTerm;

  @Output() selected = new EventEmitter<DiseaseTerm>();

  constructor() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<any>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  ngOnInit() {
    this.dataSource.data = this.data;
    this.treeControl.expandDescendants(this.data[0]);
    this.treeControl.collapseDescendants(this.selectedNode);
    // let level = this._getLevel(this.selectedNode);
    // let children = this.treeControl.getDescendants(this.data[0]);
    // let parents = this.selectedNode.parents;

    // children.forEach(child => {
    //   if (child['level'] == level - 1 && !parents.includes(child['@rid'])) {
    //     this.treeControl.collapseDescendants(child);
    //   }
    // })
  }

  transformer = (node: DiseaseTerm, level: number) => {
    let flatNode = node;
    flatNode['level'] = level;
    flatNode['expandable'] = !!node._children;
    return flatNode;
  }

  private _getLevel = (node: any) => { return node.level; };

  private _isExpandable = (node: any) => { return node.expandable; };

  private _getChildren = (node: any): Observable<any[]> => {
    return observableOf(node._children);
  }

  hasChild = (_: number, _nodeData: any) => { return _nodeData.expandable; };

  onClick(node: DiseaseTerm) {
    this.selectedNode = node;
    this.selected.emit(node);
  }
}