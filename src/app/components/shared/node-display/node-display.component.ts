import { Component, Input } from '@angular/core';
import { GraphNode } from '../../../models/graph-node';

@Component({
  selector: '[nodeDisplay]',
  templateUrl: './node-display.component.html',
  styleUrls: ['./node-display.component.scss']
})
export class NodeDisplayComponent {
  @Input('nodeDisplay') node: GraphNode;
  @Input() selectedNode;
  private _color = '';

  get color() {
    return this.node.data == this.selectedNode ? '#d32f2f' : '#1F2B65';
  }

}