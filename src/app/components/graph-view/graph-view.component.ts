import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ForceDirectedGraph, DiseaseTerm, GraphNode, GraphLink } from '../../models';
import { D3Service } from '../../services/d3.service';
import { HostListener } from '@angular/core';
import { throwMatDialogContentAlreadyAttachedError } from '@angular/material';

/**
 * Component for displaying data in a force directed graph form. 
 * @param nodes input list of graph nodes.
 * @param links input list of graph links.
 * @param selectedNode application wide selected node object.
 */
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
    @Input() selectedNode: DiseaseTerm;

    /**
     * @param selected triggers when the user single clicks on a node.
     */
    @Output() selected = new EventEmitter<DiseaseTerm>();

    private graph: ForceDirectedGraph;
    
    private _options: { width, height } = { width: window.innerWidth, height: window.innerHeight };
    private _force: number = 1 / 100;

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.graph.initSimulation(this.options);
    }

    constructor(private d3Service: D3Service, private ref: ChangeDetectorRef) { }

    /**
     * Initializes graph object and ticker.
     */
    ngOnInit() {
        this.graph = this.d3Service.getForceDirectedGraph(this.nodes, this.links, this.options);

        this.graph.ticker.subscribe((d) => {
            this.ref.markForCheck();
        })
    }

    /**
     * Initializes d3 simulation.
     */
    ngAfterViewInit() {
        this.graph.initSimulation(this.options);
    }

    /**
     * Updates graph with new nodes/links if applicable.
     * @param changes list of changes made to this component's fields.
     */
    ngOnChanges(changes: SimpleChanges) {
        if (!this.graph || !changes.nodes || !changes.links) return;
        this.graph.onChange(this.nodes, this.links, this._force);
    }

    /**
     * Getter method for options field.
     */
    get options() {
        return this._options;
    }

    /* Event triggered methods */

    /**
     * Selects input node and emits signal to other views.
     * @param node clicked node object.
     */
    onClick(node: GraphNode) {
        this.selectedNode = node.data;
        this.selected.emit(node.data);
    }

    /**
     * Updates force parameter of simulation.
     */
    onForceChange() {
        this.graph.onChange(this.nodes, this.links, this._force);
    }

}