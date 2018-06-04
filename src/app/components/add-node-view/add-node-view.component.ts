import { Component, OnInit } from '@angular/core';
import { APIService } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OntologyPayload } from '../../models';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import * as jc from 'json-cycle';

/**
 * Edge interface
 */
export interface Edge {
    type: string,
    targetName?: string,
    in?: string,
    out?: string,
    source?: string,
}

/**
 * Component for displaying the form to add new nodes to the database.
 */
@Component({
    selector: 'add-node',
    templateUrl: './add-node-view.component.html',
    styleUrls: ['add-node-view.component.scss']
})
export class AddNodeViewComponent implements OnInit {
    private _tempSubset: string = '';
    private _tempEdge = { type: '', id: '', in: '' };

    private subsets: string[] = [];
    private relationships: Edge[] = [];

    private payload: OntologyPayload = { source: '', sourceId: '' };

    searchTerm: FormControl = new FormControl();
    searchResult = [];

    /**
     * Initializes component and autocorrect feature.
     * 
     * @param {APIService} api backend api functionality access
     * @param {ActivatedRoute} route current route access 
     * @param {Router} router app router 
     */
    constructor(private api: APIService, private route: ActivatedRoute, private router: Router) {
        // Initializes autocorrect functionality for edge adding form.
        this.searchTerm.valueChanges
            .debounceTime(400)
            .subscribe(dat => {

                if (!dat) return;
                this.api.query({
                    name: dat,
                    fuzzyMatch: 1,
                    limit: 10,
                }).subscribe(data => {
                    if (!data || data.length == 0) {
                        this._tempEdge.id = '';
                    }

                    data = jc.retrocycle(data);
                    let temp = [];

                    data.forEach(json => {
                        temp.push(json);
                    });
                    this.searchResult = temp;
                });
            });
    }

    /**
     * Initializes the form with a 'Parent' relationship if passed in through
     * url parameters.
     */
    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params.parentId) {
                this.relationships.push({
                    type: 'subclassof',
                    in: '#' + params.parentId,
                    out: null
                });
            }
        });
    }

    /* Event Triggered Methods */

    /**
     * Loads temporary edge into edge list.
     * @param e selected option event
     */
    loadTerm(e): void {
        this.searchTerm.setValue(e.option.value.name);
        this._tempEdge.id = e.option.value['@rid'];
        this.addEdge();
    }

    /**
     * Deletes an edge off the temporary edge list.
     * @param edge edge to be deleted from list.
     */
    deleteEdge(edge): void {
        let i = this.relationships.findIndex(s => edge == s);
        this.relationships.splice(i, 1);
    }

    /**
     * Adds an entry to the temporary edge list.
     */
    addEdge(): void {
        if (!this.searchTerm.value || !this._tempEdge.id) return;
        switch (this._tempEdge.type) {
            case 'parent':
                this.relationships.push({
                    type: 'subclassof',
                    in: this._tempEdge.id
                });
                break;
            case 'child':
                this.relationships.push({
                    type: 'subclassof',
                    out: this._tempEdge.id
                });
                break;

            case 'alias':
                this.relationships.push({
                    type: 'aliasof',
                    out: this._tempEdge.id
                });
                break;
            default:
                return;
        }
        this._tempEdge.type = '';
        this._tempEdge.id = '';
        this.searchTerm.setValue('');
    }

    /**
     * Adds an entry to the temporary subset list.
     */
    addSubset(): void {
        let seen = false;
        this.subsets.forEach(sub => { if (sub == this._tempSubset) seen = true; });
        if (!this._tempSubset || seen) return;

        this.subsets.push(this._tempSubset);
        this._tempSubset = '';
    }

    /**
     * Deletes a subset entry from the temporary subset list.
     * @param subset subset entry to be deleted from the list.
     */
    delete(subset): void {
        let i = this.subsets.findIndex(s => subset == s);
        this.subsets.splice(i, 1);
    }

    /**
     * Collects all fields and navigates to the query results view.
     */
    addNode(): void {
        if (this._tempSubset) this.subsets.push(this._tempSubset);
        this.payload.subsets = this.subsets;

        this.api.addNode(this.payload).subscribe(response => {
            let id = response['@rid'];

            this.relationships.forEach(edge => {
                if (!edge.in) edge.in = id;
                if (!edge.out) edge.out = id;

                this.api.addRelationship(edge).subscribe();
            });

            this.router.navigate(['/results/' + id.slice(1)]);
        })
    }
}