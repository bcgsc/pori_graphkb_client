import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { DiseaseTerm } from '../../models/models';

@Component({
  selector: 'tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  providers: []
})
export class TreeViewComponent implements OnInit{

  treeControl: FlatTreeControl<any>;

  treeFlattener: MatTreeFlattener<any, any>;

  dataSource: MatTreeFlatDataSource<any, any>;

  @Input() data;
  @Input() initSelected?;
  @Output() selected = new EventEmitter<any>();

  private selectedNode;

  constructor() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
      this._isExpandable, this._getChildren);
    this.treeControl = new FlatTreeControl<any>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  ngOnInit() {
    this.dataSource.data = this.data;
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

  onClick(node: DiseaseTerm){
    this.selectedNode = node;
    this.selected.emit(node);
  }
}