import { Component, Input, OnInit, EventEmitter, Output, SimpleChanges } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { Ontology } from '../../models';
import { DataService } from '../../services';

/**
 * Component for displaying data in a hierarchical tree view format.
 * @param data disease terms formatted in a hierarchical form, with elements
 * being lowest depth roots.
 * @param selectedNode selected node variable to link this component to the 
 * other views 
 */
@Component({
  selector: 'tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  providers: []
})
export class TreeViewComponent implements OnInit {

  treeControl: FlatTreeControl<Ontology>;
  treeFlattener: MatTreeFlattener<Ontology, any>;
  dataSource: MatTreeFlatDataSource<Ontology, any>;

  @Input() data: Ontology[];
  @Input() selectedNode: Ontology;

  /**
   * @param selected triggers when the user single clicks on a node.
   */
  @Output() selected = new EventEmitter<string>();

  constructor(private dataService: DataService) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer, 
      this._getLevel,
      this._isExpandable, 
      this._getChildren
    );

    this.treeControl = new FlatTreeControl<any>(this._getLevel, this._isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  /**
   * Initializes Mat-Tree datasource, and expands tree to selected node.
   */
  ngOnInit() {
    this.dataSource.data = this.data;
    this.data.forEach(root => {
      this._expandToSelected(root)
    });
  }

  /**
   * Expands tree to ensure selected node is easily located.
   */
  ngOnChanges(changes: SimpleChanges) {
    this.treeControl.collapseAll();
    this.data.forEach(root => {
      this._expandToSelected(root);
    });
  }

  /**
   * Recursively finds and expands tree to display the selected node.
   * @param rn root node.
   */
  private _expandToSelected(rn): boolean {

    if (rn['@rid'] == this.selectedNode["@rid"]) {
      return true;
    }
    if (!rn._children) return false;

    let ret = false;
    rn._children.forEach(child => {
      if (this._expandToSelected(child)) {
        ret = true;
        this.treeControl.expand(rn);
      }
    });
    return ret;
  }

  /**
   * Adds 'level' and 'expandable' fields to the disease term objects in order
   * to be displayed.
   */
  transformer = (node: Ontology, level: number) => {
    let flatNode = node;
    flatNode['level'] = level;
    flatNode['expandable'] = !!node._children;
    return flatNode;
  }

  /**
   * Returns input node's level in the tree.
   */
  private _getLevel = (node: any) => { return node.level; };

  /**
   * Returns true if the node is expandable.
   */
  private _isExpandable = (node: any) => { return node.expandable; };

  /**
   * Returns an observable containing node's children.
   */
  private _getChildren = (node: any): Observable<any[]> => {
    return observableOf(node._children);
  }

  /**
   * Returns true iff the node has a child node.
   */
  hasChild = (_: number, _nodeData: any) => { return _nodeData.expandable; };

  /**
   * Triggered when a node in the tree is clicked.
   * @param node clicked node.
   */
  onClick(node: Ontology) {
    this.selected.emit(node['@rid']);
  }
}