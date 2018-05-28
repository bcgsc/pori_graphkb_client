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

    private tableData: DiseaseTerm[];
    private dataMap: { [id: string]: DiseaseTerm };
    private treeData: DiseaseTerm[];

    private selectedNode: DiseaseTerm;

    private params;

    constructor(private api: APIService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.params = params;
            this.refresh();
        });
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

            json.forEach(diseaseTerm => {

                let entry = this.prepareEntry(diseaseTerm);

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

    getHierarchy(): DiseaseTerm[] {
        let roots: DiseaseTerm[] = [];

        Object.keys(this.dataMap).forEach(rid => {
            if (!this.dataMap[rid].parents) {
                roots.push(this.dataMap[rid]);
            } else {
                let retrieved = false;
                this.dataMap[rid].parents.forEach(pid => {
                    if (pid in this.dataMap) {
                        let parent = this.dataMap[pid];
                        if (!('_children' in parent)) {
                            parent._children = [];
                        }
                        parent._children.push(this.dataMap[rid]);
                        retrieved = true;
                    }
                });
                // If a node's parent is not retrieved by query, the node is a de facto root.
                if (!retrieved) {
                    roots.push(this.dataMap[rid]);
                }
            }
        });

        return roots;
    }

    prepareEntry(jsonTerm): DiseaseTerm {
        let children, parents, aliases;

        if (jsonTerm['out_SubClassOf']) {
            parents = [];
            jsonTerm['out_SubClassOf'].forEach(edge => {
                edge['in']['@rid'] ? parents.push(edge['in']['@rid']) : parents.push(edge['in'])
            });
        }
        if (jsonTerm['in_SubClassOf']) {
            children = [];
            jsonTerm['in_SubClassOf'].forEach(edge => {
                edge['out']['@rid'] ? children.push(edge['out']['@rid']) : children.push(edge['out'])
            });
        }
        if (jsonTerm['out_AliasOf']) {
            aliases = [];
            jsonTerm['out_AliasOf'].forEach(edge => {
                edge['in']['@rid'] ? aliases.push(edge['in']['@rid']) : aliases.push(edge['in'])
            });
        }
        if (jsonTerm['in_AliasOf']) {
            aliases = aliases || [];
            jsonTerm['in_AliasOf'].forEach(edge => {
                edge['out']['@rid'] ? aliases.push(edge['out']['@rid']) : aliases.push(edge['out'])
            });
        }

        let entry: DiseaseTerm = {
            '@class': jsonTerm['@class'],
            sourceId: jsonTerm['sourceId'],
            createdBy: jsonTerm['createdBy']['name'],
            name: jsonTerm['name'],
            description: jsonTerm['description'],
            source: jsonTerm['source'],
            '@rid': jsonTerm['@rid'],
            longName: jsonTerm['longName'],
            '@version': jsonTerm['@version'],
            subsets: jsonTerm['subsets'],
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
        this.selectedNode = this.dataMap[node['@rid']];
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
        //TODO: add cleanup to all related nodes (Can't yet)

        this.api.deleteNode(rid).subscribe(() => {
            this.refresh();
        });
    }

    //FIX
    onSourceQuery(params) {
        this.params = params;
        this.refresh();
    }

    onNewRelationship(edge){
        this.api.addRelationship(edge).subscribe(()=>this.refresh());
    }
}

