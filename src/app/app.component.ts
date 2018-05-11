import { Component } from '@angular/core';
import { KBService } from './services/kb.service';
import { TableViewItem } from './components/table-view/table-view-datasource';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Ontologyweb';
  data: TableViewItem[];
  selectedNode: TableViewItem;

  constructor(private kbservice: KBService) {
    this.kbservice.getJSON('../../assets/get_diseases.body_expanded.json').subscribe((json) => {
      let temp = [];

      json.forEach(element => {
        if (!element['$ref']) {
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
          temp.push(entry);
        }
      });

      this.data = temp;
    });
  }

  onSelected(selected: TableViewItem){
    console.log(selected);
    this.selectedNode = selected;
  }
}
