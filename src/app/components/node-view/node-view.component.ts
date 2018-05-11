import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { TableViewItem } from '../table-view/table-view-datasource';

@Component({
  selector: 'node-view',
  templateUrl:'./node-view.component.html',
  styleUrls: ['./node-view.component.css'],
})
export class NodeViewComponent {
  @Input('node') node: TableViewItem;

  constructor(){}
}
