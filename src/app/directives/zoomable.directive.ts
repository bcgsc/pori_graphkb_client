import { Directive, Input, ElementRef, OnInit } from '@angular/core';
import { D3Service } from '../services/d3.service';

/**
 * Directive to allow zoomable functionality to be added to a force directed
 * graph.
 * @param zoomableOf element reference to the svg to be zoomed on.
 */
@Directive({
    selector: '[zoomableOf]'
})
export class ZoomableDirective implements OnInit{
    @Input('zoomableOf') zoomableOf: ElementRef;

    constructor(private d3Service: D3Service, private _element: ElementRef ){}

    ngOnInit(){
        this.d3Service.applyZoomableBehaviour(this.zoomableOf, this._element.nativeElement)
    }
}