import { Component, Input, ViewEncapsulation } from '@angular/core';
import { GraphNode } from '../../../models/graph-node';
import { DiseaseTerm } from '../../../models';

/**
 * Component for formatting/styling graph nodes.
 * @param node subject node.
 * @param selectedNode application selected node.
 */
@Component({
  selector: '[nodeDisplay]',
  templateUrl: './node-display.component.html',
  styleUrls: ['./node-display.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NodeDisplayComponent {
  @Input('nodeDisplay') node: GraphNode;
  @Input() selectedNode: DiseaseTerm;
  @Input() _nodeLabels: boolean;
  private _color = '';

  get color() {
    if (this.node.data == this.selectedNode) return '#d32f2f';
    if (this.selectedNode._children && this.selectedNode._children.includes(this.node.data)) return "#00bfa5";
    if (this.node.data._children && this.node.data._children.includes(this.selectedNode)) return "#f57c00"
    return '#1F2B65';
  }

  get nodeLabels() {
    let isEq: boolean = this.node.data == this.selectedNode;
    let isIn: boolean = this.selectedNode._children && this.selectedNode._children.includes(this.node.data);
    let isOut: boolean = this.node.data._children && this.node.data._children.includes(this.selectedNode);
    return this._nodeLabels || isEq || isIn || isOut;

  }
}