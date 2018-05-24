import { EventEmitter } from '@angular/core';
import { Link } from './link';
import { Node } from './node';
import * as d3 from 'd3';

const FORCES = {
    LINKS: 1 / 20,
    COLLISION: 1,
    CHARGE: -1
}

export class ForceDirectedGraph {
    public ticker: EventEmitter<d3.Simulation<Node, Link>> = new EventEmitter();
    public simulation: d3.Simulation<any, any>;

    public nodes: Node[] = [];
    public links: Link[] = [];

    constructor(nodes, links, options: { width, height }) {
        this.nodes = nodes;
        this.links = links;
        this.initSimulation(options);
    }

    initNodes() {
        if (!this.simulation) {
            throw new Error('simulation not yet initialized');
        }

        this.simulation.nodes(this.nodes);
    }

    initLinks() {
        if (!this.simulation) {
            throw new Error('simulation not yet initialized');
        }

        this.simulation.force('links',
            d3.forceLink(this.links).id(d => d['id'])
                .strength(FORCES.LINKS)
        );
    }

    initSimulation(options) {
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
                ticker.emit(this)
            });
            
            this.initNodes();
            this.initLinks();
            
        }
        this.simulation.force("center", d3.forceCenter(options.width / 2, options.height / 2));
        
        this.simulation.restart();
    }
}