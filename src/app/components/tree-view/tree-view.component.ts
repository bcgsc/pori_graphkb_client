import { Component, Input } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import {BehaviorSubject, Observable, of as observableOf} from 'rxjs';

@Component({
    selector: 'tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
    providers: []
  })
  export class TreeViewComponent {

    treeControl: FlatTreeControl<any>;

    treeFlattener: MatTreeFlattener<any, any>;
  
    dataSource: MatTreeFlatDataSource<any, any>;
    
    @Input('data') data: any;
     
    constructor() {
      this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
        this._isExpandable, this._getChildren);
      this.treeControl = new FlatTreeControl<any>(this._getLevel, this._isExpandable);
      this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
      this.dataSource.data = this.data;
    }
  
    transformer = (node: any, level: number) => {
      let flatNode = {};
      flatNode['filename'] = node.filename;
      flatNode['type'] = node.type;
      flatNode['level'] = level;
      flatNode['expandable'] = !!node.children;
      return flatNode;
    }
  
    private _getLevel = (node: any) => { return node.level; };
  
    private _isExpandable = (node: any) => { return node.expandable; };
  
    private _getChildren = (node: any): Observable<any[]> => {
      return observableOf(node.children);
    }
  
    hasChild = (_: number, _nodeData: any) => { return _nodeData.expandable; };
  }