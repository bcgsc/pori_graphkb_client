import { Component, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { TableViewItem } from '../table-view/table-view-datasource';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { TableViewComponent } from '../table-view/table-view.component';
import { NodeViewComponent } from '../node-view/node-view.component';

@Component({
    selector: 'data-hub',
    templateUrl: './data-hub.component.html',
    styleUrls: ['./data-hub.component.scss'],
    providers: [APIService]
})
export class DataHubComponent {
    @ViewChild(TableViewComponent) table;
    @ViewChild(NodeViewComponent) node;
    data: TableViewItem[];
    selectedNode: TableViewItem;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        let rid = this.route.snapshot.paramMap.get('rid')
        rid ? this.getRecord(rid) : this.getQuery();
    }

    getQuery() {
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

    getRecord(rid) {
        this.api.getRecord(rid).subscribe((json) => {
            this.data = [];

            json = jc.retrocycle(json);

            let entry: TableViewItem = {
                class: json['@class'],
                sourceId: json['sourceId'],
                createdBy: json['createdBy']['name'],
                name: json['name'],
                description: json['description'],
                source: json['source'],
                rid: json['@rid'],
                version: json['@version'],
                subsets: json['subsets'],
            }
            this.data.push(entry);

            this.selectedNode = entry;
        });
    }

    onSelect(node) {
        this.selectedNode = node;
        this.node.cancelEdit();
    }

    onEdit(node) {
        let i = this.data.findIndex(d => d.rid == node.rid);
        this.data[i] = node;
        this.table.refresh(node);
        // also make api call
    }
}

