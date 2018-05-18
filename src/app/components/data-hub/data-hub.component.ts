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
                    let children, parents, aliases;

                    if (element['out_SubClassOf']) {
                        parents = [];                        
                        element['out_SubClassOf'].forEach(edge => {
                            edge['in']['@rid'] ? parents.push(edge['in']['@rid']) : parents.push(edge['in'])
                        });
                    }
                    if (element['in_SubClassOf']) {
                        children = [];
                        element['in_SubClassOf'].forEach(edge => {
                            edge['out']['@rid'] ? children.push(edge['out']['@rid']) : children.push(edge['out'])
                        });
                    } 
                    if (element['out_AliasOf']) {
                        aliases = [];
                        element['out_AliasOf'].forEach(edge => {
                            edge['in']['@rid'] ? aliases.push(edge['in']['@rid']) : aliases.push(edge['in'])
                        });
                    } 
                    if (element['in_AliasOf']) {
                        aliases = aliases || [];
                        element['in_AliasOf'].forEach(edge => {
                            edge['out']['@rid'] ? aliases.push(edge['out']['@rid']) : aliases.push(edge['out'])
                        });
                    }

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
                        parents: parents,
                        children: children,
                        aliases: aliases,
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
        this.api.editNode(node.rid.slice(1), node).subscribe();
    }
    onDelete(node){
        let i = this.data.findIndex(d => d.rid == node.rid);
        this.data.splice(i,1);
        this.table.refresh(node);
        this.api.deleteNode(node.rid.slice(1)).subscribe();
        this.selectedNode = undefined;
    }
}

