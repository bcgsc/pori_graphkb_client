import { Component, Input, ViewEncapsulation, SimpleChanges } from '@angular/core';
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
  private _color = '#1F2B65';


  get color() {
    if (this._subsets.length > 0) {
      return this.subsetFiltered() ? '#80ff8b': 'rgba(31,43,101,0.5)'
    }
    if (this.node.data['@rid'] == this.selectedNode['@rid']) return '#d32f2f';
    if (this.selectedNode.children && this.selectedNode.children.includes(this.node.data['@rid'])) return "#00bfa5";
    if (this.node.data.children && this.node.data.children.includes(this.selectedNode['@rid'])) return "#f57c00";
    if(this.selectedNode.aliases && this.selectedNode.aliases.includes(this.node.data["@rid"])) return "#d9e94e";
    return '#1F2B65';
  }

  get nodeLabels(): boolean {
    if (this._subsets.length > 0) {
      return this.subsetFiltered();
    }
    let isEq: boolean = this.node.data['@rid'] == this.selectedNode['@rid'];
    let isIn: boolean = this.selectedNode.children && this.selectedNode.children.includes(this.node.data['@rid']);
    let isOut: boolean = this.node.data.children && this.node.data.children.includes(this.selectedNode['@rid']);
    let isAl: boolean = this.selectedNode.aliases && this.selectedNode.aliases.includes(this.node.data["@rid"]);
    return this._nodeLabels || isEq || isIn || isOut || isAl;

  }

  /**
   * Returns TRUE if this node passes requirements of subsets filter. FALSE o.w.
   */
  private subsetFiltered() {
    let c = true;

    if (this.node.data.subsets) {
      this._subsets.forEach(s => {
        if (!this.node.data.subsets.includes(s)) c = false;
      })
    } else {
      c = false
    }

    return c;
  }
}