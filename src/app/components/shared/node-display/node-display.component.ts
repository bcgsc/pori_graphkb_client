import { Component, Input, ViewEncapsulation } from '@angular/core';
import { GraphNode } from '../../../models/graph-node';

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
  @Input() selectedNode;
  private _color = '';

  get color() {
    return this.node.data == this.selectedNode ? '#d32f2f' : '#1F2B65';
  }

}