import { Component, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { TableViewItem } from '../table-view/table-view-datasource';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { TableViewComponent } from '../table-view/table-view.component';

@Component({
    selector: 'data-hub',
    templateUrl: './data-hub.component.html',
    styleUrls: ['./data-hub.component.scss'],
    providers: [APIService]
})
export class DataHubComponent {
    @ViewChild(TableViewComponent) table;
    data: TableViewItem[];
    selectedNode: TableViewItem;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params =>
            this.api.query(params).subscribe((json) => {
                this.data = [];

                json = jc.retrocycle(json);

                json.forEach(element => {

                    let entry: TableViewItem = {
                        class: element['@class'],
                        sourceId: element['sourceId'],
                        createdBy: element['createdBy']['name'],
                        name: element['name'],
                        description: element['description'],
                        source: element['source'],
                        rid: element['@rid'],
                        version: element['@version'],
                        subsets: element['subsets'],
                    }
                    this.data.push(entry);
                });

                this.selectedNode = this.data[0];
            })
        );
    }

    onSelect(node) {
        this.selectedNode = node;
    }

    onEdit(node){
        let i = this.data.findIndex(d => d.rid == node.rid);
        this.data[i] = node;
        console.log(i);
        this.table.refresh();
        // also make api call
    }   
}

