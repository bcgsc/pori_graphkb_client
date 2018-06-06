import { Component, Input, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { GraphNode } from '../../../models/graph-node';
import { Ontology } from '../../../models';

const _isRelated = function (domain: any[], node: any) {
  return domain && domain.includes(node['@rid']);
}


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
      return this.subsetFiltered() ? '#80ff8b' : 'rgba(31,43,101,0.5)'
    }
    if (this.node.data['@rid'] == this.selectedNode['@rid']) return '#d32f2f';
    if (_isRelated(this.selectedNode.children, this.node.data) || _isRelated(this.node.data.parents, this.selectedNode)) return "#00bfa5";
    if (_isRelated(this.node.data.children, this.selectedNode) || _isRelated(this.selectedNode.parents, this.node.data)) return "#f57c00";
    if (_isRelated(this.node.data.aliases, this.selectedNode) || _isRelated(this.selectedNode.aliases, this.node.data)) return "#d9e94e";
    return '#1F2B65';
  }

  get nodeLabels(): boolean {
    if (this._subsets.length > 0) {
      return this.subsetFiltered();
    }
    let isEq = this.node.data['@rid'] == this.selectedNode['@rid'];
    let isIn = _isRelated(this.selectedNode.children, this.node.data) || _isRelated(this.node.data.parents, this.selectedNode);
    let isOut = _isRelated(this.node.data.children, this.selectedNode) || _isRelated(this.selectedNode.parents, this.node.data);
    let isAl = _isRelated(this.node.data.aliases, this.selectedNode) || _isRelated(this.selectedNode.aliases, this.node.data);
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