import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ForceDirectedGraph, DiseaseTerm, GraphNode, GraphLink } from '../../models';
import { D3Service } from '../../services/d3.service';
import { HostListener } from '@angular/core';
import { throwMatDialogContentAlreadyAttachedError } from '@angular/material';

@Component({
    selector: 'graph-view',
    templateUrl: './graph-view.component.html',
    providers: [D3Service],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit, AfterViewInit {
    @Input() nodes: GraphNode[];
    @Input() links: GraphLink[];
    @Input() selectedNode;

    @Output() selected = new EventEmitter<DiseaseTerm>();
    graph: ForceDirectedGraph;
    private _options: { width, height } = { width: 0, height: 0 };

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.graph.initSimulation(this.options);
    }

    constructor(private d3Service: D3Service, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.graph = this.d3Service.getForceDirectedGraph(this.nodes, this.links, this.options);

        this.graph.ticker.subscribe((d) => {
            this.ref.markForCheck();
        })
    }

    ngAfterViewInit() {
        this.graph.initSimulation(this.options);
    }

    ngOnChanges(changes: SimpleChanges) {
        if(!this.graph || !changes.nodes || !changes.links) return;
        this.graph.onChange(changes.nodes.currentValue, changes.links.currentValue, this.options);
      }

    //Move this to css maybe
    get options() {
        return this._options = {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    onClick(node) {
        this.selectedNode = node.data;
        this.selected.emit(node.data);
    }

}