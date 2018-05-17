import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';

@Component({
    selector: 'add-node',
    templateUrl: './add-node-view.component.html',
    styleUrls:['add-node-view.component.scss']
})
export class AddNodeViewComponent{
    private _temp = '';
    subsets = [];

    constructor(private api: APIService){}

    add(): void{
        if(!this._temp) return;
        console.log(this._temp);
        this.subsets.push(this._temp);
        this._temp = '';
    }

    delete(subset): void{
        let i =this.subsets.findIndex(s => subset == s);
        this.subsets.splice(i,1);
    }
    
}