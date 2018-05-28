import { Component, Input } from '@angular/core';
import { GraphNode } from '../../models/graph-node';

@Component({
  selector: '[nodeDisplay]',
  template: `
      <svg:g [attr.transform]="'translate(' + node.x + ',' + node.y + ')'">
        <svg:circle *ngIf="node.data != selectedNode"
            class="node"
            [attr.fill]="node.color"
            cx="0"
            cy="0"
            [attr.r]="node.r">
        </svg:circle>
        <svg:circle *ngIf="node.data == selectedNode"
        class="node"
        fill="red"
        cx="0"
        cy="0"
        [attr.r]="node.r">
    </svg:circle>
        <svg:text
            class="node-name"
            [attr.font-size]="node.fontSize">
          {{node.data.name}}
        </svg:text>
      </svg:g>
  `,
  styles:[`
    .node {
      cursor: pointer;
      transition: stroke-width 0.1s ease-out,
          fill 0.1s ease-out,
          stroke 0.1s ease-out;

      stroke: black;
      stroke-width: 0.25;
      }

  .node-name {
        font-family: 'Lato';
        text-anchor: middle;
        alignment-baseline: central;
        font-weight: 300;
        fill: #1F2B65;
        cursor: pointer;
      }`
    ]
})
export class NodeDisplayComponent {
  @Input('nodeDisplay') node: GraphNode;
  @Input() selectedNode;
}