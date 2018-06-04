import { Component, ViewChild, HostBinding } from '@angular/core';
import { APIService } from '../../services/api.service';
import * as jc from 'json-cycle';
import { Ontology, GraphLink, GraphNode } from '../../models';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { TableViewComponent } from '../table-view/table-view.component';
import { NodeViewComponent } from '../node-view/node-view.component';
import { Edge } from '../add-node-view/add-node-view.component';
import { TreeViewComponent } from '../tree-view/tree-view.component';

/**
 * Component that handles all communication with the server, and allocating of
 * data objects to the different child components. Defines the layout of the 
 * different data views.
 */
@Component({
    selector: 'data-hub',
    templateUrl: './data-hub.component.html',
    styleUrls: ['./data-hub.component.scss'],
    providers: [APIService]
})
export class DataHubComponent {
    @ViewChild(TreeViewComponent) tree;

    // Table formatted data
    private tableData: Ontology[];

    // Tree formatted data
    private treeData: Ontology[];

    // Graph formatted nodes and links
    private nodes: GraphNode[] = [];
    private links: GraphLink[] = [];

    // Master query result map
    private dataMap: { [id: string]: Ontology };

    private selectedNode: Ontology;
    private subsets: string[] = [];

    private params: { [key: string]: any };

    constructor(private api: APIService, private route: ActivatedRoute, private router: Router) { }

    /**
     * Stores query parameters passed through the url, then refreshes the view
     */
    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.params = params;
            this._refresh();
        });
    }

    /**
     * Clears all stored data objects and queries the api.
     * @param queryRid optional parameter that defines a node to be initially
     * selected.
     */
    private _refresh(queryRid?: string): void {
        delete this.tableData;
        delete this.dataMap;
        delete this.treeData;
        delete this.selectedNode;
        this.nodes = [];
        this.links = [];
        this.subsets = [];

        let rid = this.route.snapshot.paramMap.get('rid')
        rid ? this._getRecord(rid) : this._getQuery(queryRid);
    }

    /**
     * Queries the api with parameters as passed in the url. 
     * @param queryRid optional parameter that defines a node to be initially 
     * selected.
     */
    private _getQuery(queryRid?: string): void {
        this.api.query(this.params).subscribe((json) => {
            let i = 0;
            this.tableData = [];
            this.dataMap = {};

            json = jc.retrocycle(json);

            json.forEach(diseaseTerm => {

                let entry = this._prepareEntry(diseaseTerm);

                if (queryRid && entry['@rid'] === queryRid) {
                    i = this.tableData.length;
                }

                this.dataMap[entry["@rid"]] = entry;
                this.tableData.push(entry);
            });

            this.treeData = this._getHierarchy();
            this.selectedNode = this.tableData[i];

            this.treeData.forEach(root => {
                let gn = new GraphNode(root['@rid'], root);
                this.nodes.push(gn);
                this._buildGraph(gn);
            });
            console.log(this.nodes.length);

            // /** constructing the nodes array */
            // let N = Math.min(100, this.tableData.length);
            // for (let i = 1; i <= N; i++) {
            //     this.nodes.push(new GraphNode(i, this.tableData[i - 1]));
            // }

            // for (let i = 1; i < N; i++) {
            //     this.nodes[i - 1].linkCount++;
            //     this.nodes[i].linkCount++;
            //     this.links.push(new GraphLink(this.nodes[i - 1], this.nodes[i], ''));
            // }

        });
    }

    /**
     * Retrieves a record from the database with input rid. If no record exists
     * in the database, redirects to the query home page.
     * @param rid id for the api endpoint.
     */
    private _getRecord(rid: string): void {
        this.api.getRecord(rid).subscribe(json => {
            this.tableData = [];
            this.dataMap = {};

            json = jc.retrocycle(json);

            let entry = this._prepareEntry(json);

            this.tableData.push(entry);
            this.dataMap[entry["@rid"]] = entry

            this.treeData = this._getHierarchy();
            this.selectedNode = this.tableData[0];

            /** constructing the nodes array */
            let N = Math.min(100, this.tableData.length);
            for (let i = 1; i <= N; i++) {
                this.nodes.push(new GraphNode(i, this.tableData[i - 1]));
            }

            for (let i = 1; i < N; i++) {
                this.nodes[i - 1].linkCount++;
                this.nodes[i].linkCount++;
                this.links.push(new GraphLink(this.nodes[i - 1], this.nodes[i], ''));
            }

            // this.treeData.forEach(root => {
            //     let gn = new GraphNode(root['@rid'], root);
            //     this.nodes.push(gn);
            //     this.buildGraph(gn);
            // });

        });
    }

    /**
     * Recursively builds force directed graph datatype to be passed to the
     * graph view, connecting parent/child nodes together (not aliases).
     * 
     * @param rgn root graph node object
     */
    private _buildGraph(rgn: GraphNode): void {
        if (rgn.data._children) {
            rgn.data._children.forEach(child => {
                let cgn = new GraphNode(child['@rid'], child);
                this.nodes.push(cgn);
                let l = new GraphLink(cgn, rgn, 'subclassof');
                cgn.linkCount++;
                rgn.linkCount++;
                this.links.push(l);

                // if (cgn.data.aliases) {
                //     cgn.data.aliases.forEach(alias => {
                //         if (alias in this.dataMap) {
                //             let agn: GraphNode = this.nodes.filter(node => node.data["@rid"] == alias)[0];

                //             if (!agn) {
                //                 agn = new GraphNode(alias, this.dataMap[alias]);
                //                 console.log(agn.data.name);

                //                 this.nodes.push(agn);

                //             }
                //             l = new GraphLink(agn, cgn, 'aliasof');
                //             this.links.push(l);
                //             l = new GraphLink(cgn, agn, '');
                //             this.links.push(l);
                //             agn.linkCount += 2;
                //             rgn.linkCount += 2;
                //         }
                //     });
                // }

                this._buildGraph(cgn);
            });
        }

        return;
    }

    /**
     * Helper function to format query result data for the tree view.
     */
    private _getHierarchy(): Ontology[] {
        let roots: Ontology[] = [];

        Object.keys(this.dataMap).forEach(rid => {
            if (!this.dataMap[rid].parents) {
                roots.push(this.dataMap[rid]);
            } else {
                let retrieved = false;
                this.dataMap[rid].parents.forEach(pid => {
                    if (pid in this.dataMap && !retrieved) {
                        let parent = this.dataMap[pid];
                        if (!('_children' in parent)) {
                            parent._children = [];
                        }
                        parent._children.push(this.dataMap[rid]);
                        retrieved = true;
                    }
                });
                // If none of a node's parents is not retrieved by query, the node is displayed as a root.
                if (!retrieved) {
                    roots.push(this.dataMap[rid]);
                }
            }
        });

        return roots;
    }

    /**
     * Processes json disease term into front end model.
     * @param jsonTerm disease ontology term in JSON form as returned from
     * the server.
     */
    private _prepareEntry(jsonTerm: JSON): Ontology {
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

        let entry: Ontology = {
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

        if (jsonTerm['subsets']) {
            jsonTerm['subsets'].forEach(subset => {
                if (!this.subsets.includes(subset)) this.subsets.push(subset);
            })
        }
        return entry;
    }

    /* Event triggered methods */

    /**
     * Triggered when user selects a node in one of the views. Updates the 
     * application wide selected node object.
     * @param rid record ID of the selected node.
     * @param tree optional flag to alert when to expand the tree view.
     */
    onSelect(rid: string, tree?: boolean) {
        console.log(rid);
        this.selectedNode = this.dataMap[rid];
        if (!tree) { this.tree.selectedNode = this.selectedNode; this.tree.onOuterChange(); }
    }

    /**
     * Triggered when user confirms edits made to a node. Sends an API PATCH 
     * request and then refreshes the view, making the same query.
     * @param node updated node object after edits.
     */
    onEdit(node: Ontology) {
        this.api.editNode(node['@rid'].slice(1), node).subscribe(() => {
            this._refresh(node['@rid']);
        });
    }

    /**
     * Triggered when user deletes a node. Sends an API DELETE request and then
     * refreshes the view, making the same query.
     * @param node record to be deleted.
     */
    onDelete(node: Ontology) {
        let rid = node['@rid'].slice(1);
        //TODO: add cleanup to all related nodes (Can't yet)

        this.api.deleteNode(rid).subscribe(() => {
            this._refresh();
        });
    }

    //under construction
    onQuery(params) {
        this.params = params.params;
        if (params.rid) this.router.navigate(['/results/' + params.rid], { queryParams: this.params });
        this._refresh();
    }

    /**
     * Makes API call adding a new edge to the database. Refreshes the view
     * when the call is executed.
     * @param edge new edge to be added
     */
    onNewRelationship(edge: Edge) {
        this.api.addRelationship(edge).subscribe(() => this._refresh());
    }

    /**
     * under construction
     * @param node 
     */
    onNewGraphNode(node: Ontology) {
        this.nodes = this.nodes.slice();
        this.links = this.links.slice();
        let n = new GraphNode(this.nodes.length + 1, node);
        n.fx = null;
        n.fy = null;
        this.nodes.push(n);
        this.nodes[this.nodes.length - 1].linkCount++;
        this.nodes[this.nodes.length - 3].linkCount++;

        let l = new GraphLink(this.nodes[this.nodes.length - 3], this.nodes[this.nodes.length - 1], '');
        this.links.push(l);
    }
}

