import { Component, Input, ViewEncapsulation } from '@angular/core';
import { GraphNode } from '../../../models/graph-node';
import { Ontology } from '../../../models';

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
  @Input() selectedNode: Ontology;
  @Input() _nodeLabels: boolean;
  @Input() _subsets: string[];
  private _color = '';

  get color() {
    if (this._subsets.length > 0) {
      let c = '#80ff8b';

      if (this.node.data.subsets) {
        this._subsets.forEach(s =>{
          if(!this.node.data.subsets.includes(s)) c = 'rgba(31, 43, 101, 0.5)';
        })
      } else{
        c = 'rgba(31, 43, 101, 0.5)'
      }

      return c;
    }
    if (this.node.data == this.selectedNode) return '#d32f2f';
    if (this.selectedNode._children && this.selectedNode._children.includes(this.node.data)) return "#00bfa5";
    if (this.node.data._children && this.node.data._children.includes(this.selectedNode)) return "#f57c00";
    // if(this.selectedNode.aliases && this.selectedNode.aliases.includes(this.node.data["@rid"])) return "#d9e94e";
    return '#1F2B65';
  }

  get nodeLabels() {
    let isEq: boolean = this.node.data == this.selectedNode;
    let isIn: boolean = this.selectedNode._children && this.selectedNode._children.includes(this.node.data);
    let isOut: boolean = this.node.data._children && this.node.data._children.includes(this.selectedNode);
    // let isAl: boolean = this.selectedNode.aliases && this.selectedNode.aliases.includes(this.node.data["@rid"]);
    let isAl = false;
    return this._nodeLabels || isEq || isIn || isOut || isAl;

  }
}