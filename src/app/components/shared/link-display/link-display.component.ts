import { Component, Input } from '@angular/core';
import { GraphLink } from '../../../models/graph-link';

@Component({
  selector: '[linkDisplay]',
  templateUrl: './link-display.component.html',
  styleUrls: ['./link-display.component.scss']
})
export class LinkDisplayComponent {
  @Input('linkDisplay') link: GraphLink;
}