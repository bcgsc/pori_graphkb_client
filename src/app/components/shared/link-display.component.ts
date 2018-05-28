import { Component, Input } from '@angular/core';
import { GraphLink } from '../../models/graph-link';

@Component({
  selector: '[linkDisplay]',
  template: `
    <svg:line
        class="link"
        [attr.x1]="link.source.x"
        [attr.y1]="link.source.y"
        [attr.x2]="link.target.x"
        [attr.y2]="link.target.y"
    ></svg:line>
  `,
  styles: [`
    .link {
      stroke-width: 0.75;
      stroke: #999;
      stroke-opacity: 0.5;
    }`
  ]
})
export class LinkDisplayComponent {
  @Input('linkDisplay') link: GraphLink;
}