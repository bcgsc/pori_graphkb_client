import { Component, ViewChild, HostBinding } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { DiseaseTerm } from '../../models';
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
    disabled = true;

    tableData: DiseaseTerm[];
    dataMap: { [id: string]: any };
    treeData;

    selectedNode: DiseaseTerm;

    params;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.params = params;
            this.refresh();
        })
    }

    //TODO: make this less confusing
    refresh(queryRid?) {
        delete this.tableData;
        delete this.dataMap;
        delete this.treeData;
        delete this.selectedNode;

        let rid = this.route.snapshot.paramMap.get('rid')
        rid ? this.getRecord(rid) : this.getQuery(queryRid);
    }

    getQuery(rid?) {
        this.api.query(this.params).subscribe((json) => {
            let i = 0;
            this.tableData = [];
            this.dataMap = {};

            json = jc.retrocycle(json);

            json.forEach(element => {

                let entry = this.prepareEntry(element);

                if (rid && entry['@rid'] === rid) {
                    i = this.tableData.length;
                }

                this.dataMap[entry["@rid"]] = entry;
                this.tableData.push(entry);
            });

            this.treeData = this.getHierarchy();
            this.selectedNode = this.tableData[i];
        });
    }

    getRecord(rid) {
        this.api.getRecord(rid).subscribe((json) => {
            this.tableData = [];
            this.dataMap = {};

            json = jc.retrocycle(json);

            let entry = this.prepareEntry(json);

            this.tableData.push(entry);
            this.dataMap[entry["@rid"]] = entry

            this.treeData = this.getHierarchy();
            this.selectedNode = this.tableData[0];
        });
    }

    getHierarchy(): any[] {
        let inMap = Object.assign({}, this.dataMap);
        let h = [];
        Object.keys(inMap).forEach(element => {
            if (!inMap[element].parents) {
                h.push(inMap[element]);
            } else {
                let t = true;
                inMap[element].parents.forEach(pid => {
                    if (pid in inMap) {
                        let parent = inMap[pid];
                        if (!('_children' in parent)) {
                            parent._children = [];
                        }
                        parent._children.push(inMap[element]);
                    } else if (t) {
                        t = false;
                        h.push(inMap[element]);
                    }
                })
            }
        });

        return h;
    }

    prepareEntry(element): DiseaseTerm {
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
        return entry;
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
     * @param node record to be deleted.
     */
    onDelete(node: DiseaseTerm) {
        let rid = node['@rid'].slice(1);
        //TODO: add cleanup to all related nodes

        if (node.aliases) {
            node.aliases.forEach(alias => {
                this.api.getRecord(alias.slice(1)).subscribe(json => {
                    let entry = this.prepareEntry(json);
                    let i = entry.aliases.findIndex(d => d['@rid'] == rid);
                    entry.aliases = entry.aliases.splice(i, 1);
                    this.api.editNode(alias.slice(1), entry).subscribe();
                })
            })
        }
        if (node.parents) {
            node.parents.forEach(parent => {
                this.api.getRecord(parent.slice(1)).subscribe(json => {
                    let entry = this.prepareEntry(json);
                    let i = entry.children.findIndex(d => d['@rid'] == rid);
                    entry.children = entry.children.splice(i, 1);
                    console.log(entry);
                    this.api.editNode(parent.slice(1), entry).subscribe();
                })
            })
        }
        if (node.children) {
            node.children.forEach(child => {
                this.api.getRecord(child.slice(1)).subscribe(json => {
                    let entry = this.prepareEntry(json);
                    let i = entry.parents.findIndex(d => d['@rid'] == rid);
                    entry.parents = entry.parents.splice(i, 1);
                    this.api.editNode(child.slice(1), entry).subscribe();
                })
            })
        }

        this.api.deleteNode(rid).subscribe(() => {
            this.refresh();
        });
    }

    //FIX
    onSourceQuery(params) {
        this.params = params;
        this.refresh();
    }
}

