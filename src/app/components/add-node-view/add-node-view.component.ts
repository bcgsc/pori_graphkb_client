import { Component, OnInit } from '@angular/core';
import { APIService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';

export interface Edge {
    type: string,
    in?: string,
    out?: string,
}

@Component({
    selector: 'add-node',
    templateUrl: './add-node-view.component.html',
    styleUrls: ['add-node-view.component.scss']
})
export class AddNodeViewComponent implements OnInit {
    private tempSubset = '';
    private subsets = [];
    private payload;
    private rid;
    private relationships: Edge[] = [];
    private tempEdge = { type: '', id: '', in: '' };

    constructor(private api: APIService, private route: ActivatedRoute) { }

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

    deleteEdge(edge){
        let i = this.relationships.findIndex(s => edge == s);
        this.relationships.splice(i, 1);
    }

    addEdge() {
        if(!this.tempEdge.id) return;
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
                    type: this.tempEdge.type,
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

}