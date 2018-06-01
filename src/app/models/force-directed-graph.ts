import { EventEmitter } from '@angular/core';
import { GraphLink } from './graph-link';
import { GraphNode } from './graph-node';
import * as d3 from 'd3';

/**
 * Force directed graph model for the graph view.
 */
export class ForceDirectedGraph {
    public ticker: EventEmitter<d3.Simulation<GraphNode, GraphLink>> = new EventEmitter();
    public simulation: d3.Simulation<any, any>;

    public nodes: GraphNode[] = [];
    public links: GraphLink[] = [];
    public force: number;

    /**
     * Initializes the graph and simulation.
     * @param nodes input list of node objects.
     * @param links input list of link objects.
     * @param options target width and height of simulation.
     */
    constructor(nodes: GraphNode[], links: GraphLink[], options: { width, height }, force: number) {
        this.nodes = nodes;
        this.links = links;
        this.force = force;
        this.initSimulation(options);
    }

    /**
     * Updates simulation parameters.
     * @param nodes updated list of node objects.
     * @param links updated list of link objects.
     * @param force updated force parameter.
     */
    onChange(nodes: GraphNode[], links: GraphLink[], force: number) {
        this.force = force;
        this.nodes = nodes;
        this.links = links;
        this.initGraphNodes();
        this.initGraphLinks();
    }

    /**
     * Initializes nodes' positions and velocities.
     */
    initGraphNodes() {
        if (!this.simulation) {
            throw new Error('simulation not yet initialized');
        }
        this.simulation.nodes(this.nodes);
    }

    /**
     * Initializes link's start/end points, as well as bond strength.
     */
    initGraphLinks() {
        if (!this.simulation) {
            throw new Error('simulation not yet initialized');
        }

        this.simulation.force('links',
            d3.forceLink(this.links).id(d => d['id'])
                .strength(this.force)
        );
    }

    /**
     * Initializes simulation parameters and nodes/links.
     * @param options simulation width and height.
     */
    initSimulation(options: { width: number, height: number }) {
        if (!options || !options.width || !options.height) {
            throw new Error('missing options when initializing simulation');
        }

        if (!this.simulation) {
            const ticker = this.ticker;
            let color = d3.scaleOrdinal(d3.schemeCategory10);

            this.simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(d => d['id']))
                .force("charge", d3.forceManyBody());


            this.simulation.on('tick', function () {
                ticker.emit(this);
            });

            this.initGraphNodes();
            this.initGraphLinks();

        }
        this.simulation.force("center", d3.forceCenter(options.width / 2, options.height / 2));

        this.simulation.restart();
    }
}