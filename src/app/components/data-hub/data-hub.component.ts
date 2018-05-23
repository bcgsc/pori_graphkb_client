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

    tableData: DiseaseTerm[];
    dataMap: { [id: string]: any };
    treeData;

    selectedNode: DiseaseTerm;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.refresh();
    }

    //TODO: make this less confusing
    refresh(queryRid?) {
        this.tableData = undefined;
        let rid = this.route.snapshot.paramMap.get('rid')
        rid ? this.getRecord(rid) : this.getQuery(queryRid);
    }

    getQuery(rid?) {
        this.route.queryParams.subscribe(params =>
            this.api.query(params).subscribe((json) => {
                let i = 0;
                this.tableData = [];
                this.dataMap = {};

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
                        i = this.tableData.length;
                    }
                    this.tableData.push(entry);
                    this.dataMap[entry["@rid"]] = entry;
                });

                this.selectedNode = this.tableData[i];
                this.treeData = this.getHierarchy();
                this.treeData.forEach(root => {
                    if (root._children) console.log(root);
                })
            })
        );
    }

    getRecord(rid) {
        this.api.getRecord(rid).subscribe((json) => {
            this.tableData = [];
            this.dataMap = {};

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

            this.tableData.push(entry);
            this.dataMap[entry["@rid"]] = entry;
            this.treeData = this.getHierarchy();
            this.selectedNode = this.tableData[0];
        });
    }

    getHierarchy(): any[] {
        let h = [];
        Object.keys(this.dataMap).forEach(element => {
            if (!this.dataMap[element].parents) {
                h.push(this.dataMap[element]);
            } else {
                this.dataMap[element].parents.forEach(pid => {
                    if (pid in this.dataMap) {
                        let parent = this.dataMap[pid];
                        if (!('_children' in parent)) {
                            parent._children = [];
                        }
                        parent._children.push(this.dataMap[element]);
                    }
                })
            }
        });

        return h;
    }

    /* Event triggered methods */

    /**
     * Triggered when user selects a node in one of the views.
     * @param node record ID of the selected node.
     */
    onSelect(node: DiseaseTerm) {
        this.node = undefined;
        this.selectedNode = node;
    }

    /**
     * Triggered when user confirms edits made to a node.
     * @param node updated node object after edits.
     */
    onEdit(node: DiseaseTerm) {
        this.api.editNode(node['@rid'].slice(1), node).subscribe(() => {
            this.refresh(node['@rid']);
        });
    }

    /**
     * Triggered when user deletes a node.
     * @param rid record ID of the deleted node.
     */
    onDelete(rid: string) {
        this.api.deleteNode(rid.slice(1)).subscribe(() => {
            this.refresh();
        });
    }
}

