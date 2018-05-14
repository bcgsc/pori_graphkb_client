import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { APIService } from '../../services/api.service';
import { TableViewItem } from '../table-view/table-view-datasource';
import { NodeViewComponent } from '../node-view/node-view.component';
import * as jc from 'json-cycle';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {  
  title = 'Ontologyweb';
  data: TableViewItem[];
  selectedNode: TableViewItem;

  constructor(private api: APIService) {
    this.api.getJSON('../../assets/get_diseases.body_expanded.json').subscribe((json) => {
      this.data = [];
      json = jc.retrocycle(json);

      json.forEach(element => {
          let createdBy;

          if (element['createdBy']['$ref']) {
            let index = element['createdBy']['$ref'].split('[')[1].split(']')[0];
            createdBy = json[index]['createdBy']['name'];
          }

          let entry: TableViewItem = {
            class: element['@class'],
            sourceId: element['sourceId'],
            createdBy: (element['createdBy']['name']) ? element['createdBy']['name'] : createdBy,
            name: element['name'],
            description: element['description'],
            source: element['source'],
            rid: element['@rid'],
            version: element['@version'],
          }
          this.data.push(entry);
      });

      this.selectedNode = this.data[0];
    });
  }

  onSelected(selected: TableViewItem){
    this.selectedNode = selected;
  }
  onEdit(edited: TableViewItem){
    // Need api
  }
}
