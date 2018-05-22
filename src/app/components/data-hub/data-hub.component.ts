import { Component, ViewChild } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { DiseaseTerm } from '../../models/models';
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
    data: DiseaseTerm[];
    selectedNode: DiseaseTerm;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.refresh();
    }

    getQuery(rid?) {
        this.route.queryParams.subscribe(params =>
            this.api.query(params).subscribe((json) => {
                let i = 0;
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

                    let entry: DiseaseTerm = {
                        '@class': element['@class'],
                        sourceId: element['sourceId'],
                        createdBy: element['createdBy']['name'],
                        name: element['name'],
                        description: element['description'],
                        source: element['source'],
                        '@rid': element['@rid'],
                        longName: element['longName'],
                        '@version': element['@version'],
                        subsets: element['subsets'],
                        parents: parents,
                        children: children,
                        aliases: aliases,
                    }
                    if (rid && entry['@rid'] === rid) {
                        i = this.data.length;
                        console.log(i);
                    }
                    this.data.push(entry);
                });

                this.selectedNode = this.data[i];
            })
        );
    }

    getRecord(rid) {
        this.api.getRecord(rid).subscribe((json) => {
            this.data = [];

            json = jc.retrocycle(json);

            let children, parents, aliases;

            if (json['out_SubClassOf']) {
                parents = [];
                json['out_SubClassOf'].forEach(edge => {
                    edge['in']['@rid'] ? parents.push(edge['in']['@rid']) : parents.push(edge['in'])
                });
            }
            if (json['in_SubClassOf']) {
                children = [];
                json['in_SubClassOf'].forEach(edge => {
                    edge['out']['@rid'] ? children.push(edge['out']['@rid']) : children.push(edge['out'])
                });
            }
            if (json['out_AliasOf']) {
                aliases = [];
                json['out_AliasOf'].forEach(edge => {
                    edge['in']['@rid'] ? aliases.push(edge['in']['@rid']) : aliases.push(edge['in'])
                });
            }
            if (json['in_AliasOf']) {
                aliases = aliases || [];
                json['in_AliasOf'].forEach(edge => {
                    edge['out']['@rid'] ? aliases.push(edge['out']['@rid']) : aliases.push(edge['out'])
                });
            }

            let entry: DiseaseTerm = {
                '@class': json['@class'],
                sourceId: json['sourceId'],
                createdBy: json['createdBy']['name'],
                name: json['name'],
                description: json['description'],
                source: json['source'],
                '@rid': json['@rid'],
                longName: json['longName'],
                '@version': json['@version'],
                subsets: json['subsets'],
                parents: parents,
                children: children,
                aliases: aliases,
            }
            this.data.push(entry);

            this.selectedNode = this.data[0];
        });
    }

    refresh(queryRid?) {
        this.data = undefined;
        let rid = this.route.snapshot.paramMap.get('rid')
        rid ? this.getRecord(rid) : this.getQuery(queryRid);
    }

    onSelect(rid) {
        this.selectedNode = rid;
        this.node.cancelEdit();
    }

    onEdit(node: DiseaseTerm) {
        this.api.editNode(node['@rid'].slice(1), node).subscribe(() => {
            this.refresh(node['@rid']);
        });
    }
    onDelete(node: DiseaseTerm) {
        this.api.deleteNode(node['@rid'].slice(1)).subscribe(() => {
            this.refresh();
        });
    }
}

