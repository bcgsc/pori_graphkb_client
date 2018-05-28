import { Directive, Input, ElementRef, OnInit } from '@angular/core';
import { GraphNode, ForceDirectedGraph } from '../models';
import { D3Service } from '../services/d3.service';

@Directive({
    selector: '[draggableNode]'
})
export class DraggableDirective{
    @Input('draggableNode') draggableNode: GraphNode;
    @Input('draggableInGraph') draggableInGraph: ForceDirectedGraph;

    constructor(private d3Service: D3Service, private _element: ElementRef){}

    ngOnInit(){
        this.d3Service.applyDraggableBehaviour(this._element.nativeElement, this.draggableNode, this.draggableInGraph);
    }
}