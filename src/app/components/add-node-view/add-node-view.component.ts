import { Component, OnInit } from '@angular/core';
import { APIService } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DiseasePayload } from '../../models';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import * as jc from 'json-cycle';

export interface Edge {
    type: string,
    in?: string,
    out?: string,
    source?: string,
}

@Component({
    selector: 'add-node',
    templateUrl: './add-node-view.component.html',
    styleUrls: ['add-node-view.component.scss']
})
export class AddNodeViewComponent implements OnInit {
    private tempSubset = '';
    private subsets = [];
    private payload: DiseasePayload = { source: '', sourceId: '' };
    private relationships: Edge[] = [];
    private tempEdge = { type: '', id: '', in: '' };

    searchTerm: FormControl = new FormControl();
    searchResult = [];

    constructor(private api: APIService, private route: ActivatedRoute, private router: Router) {
        this.searchTerm.valueChanges
            .debounceTime(400)
            .subscribe(dat => {
                if (!dat) return;
                this.api.query({
                    name: dat,
                    fuzzyMatch: 1,
                    limit: 10,
                }).subscribe(data => {
                    data = jc.retrocycle(data);
                    let temp = [];

                    data.forEach(json => {
                        temp.push(json);
                    });
                    this.searchResult = temp;
                })
            })
    }

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

    deleteEdge(edge) {
        let i = this.relationships.findIndex(s => edge == s);
        this.relationships.splice(i, 1);
    }

    addEdge() {
        if (!this.tempEdge.id) return;
        switch (this.tempEdge.type) {
            case 'parent':
                this.relationships.push({
                    type: 'subclassof',
                    in: '#' + this.tempEdge.id
                });
                break;
            case 'child':
                this.relationships.push({
                    type: 'subclassof',
                    out: '#' + this.tempEdge.id
                });
                break;

            case 'alias':
                this.relationships.push({
                    type: 'aliasof',
                    out: '#' + this.tempEdge.id
                });
                break;
            default:
                return;
        }
        this.tempEdge.type = '';
        this.tempEdge.id = '';
    }

    addSubset(): void {
        if (!this.tempSubset) return;
        console.log(this.tempSubset);
        this.subsets.push(this.tempSubset);
        this.tempSubset = '';
    }

    delete(subset): void {
        let i = this.subsets.findIndex(s => subset == s);
        this.subsets.splice(i, 1);
    }

    addNode(): void {
        if (this.tempSubset) this.subsets.push(this.tempSubset);
        this.payload.subsets = this.subsets;

        this.api.addNode(this.payload).subscribe(response => {
            let id = response['@rid'];

            this.relationships.forEach(edge => {
                if (!edge.in) edge.in = id;
                if (!edge.out) edge.out = id;

                this.api.addRelationship(edge).subscribe();
            });


            //Cascading relationship calls
            this.router.navigate(['/table/' + id.slice(1)]);
        })

    }
}