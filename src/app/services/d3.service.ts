import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { GraphNode } from '../models/graph-node';
import { GraphLink } from '../models/graph-link';
import { ForceDirectedGraph } from '../models/force-directed-graph';

/**
 * Service to handle d3 functionality for the force directed graph.
 */
@Injectable()
export class D3Service {

    constructor() { }

    /**
     * Applies zoom functionality to svg element.
     * @param svgElement html svg element reference
     * @param containerElement html container element reference
     */
    applyZoomableBehaviour(svgElement, containerElement) {
        let svg, container, zoomed, zoom;

        svg = d3.select(svgElement);
        container = d3.select(containerElement);

        zoomed = () => {
            const transform = d3.event.transform;
            container.attr("transform", "translate(" + transform.x + "," + transform.y + ")scale(" + transform.k + ")");
        }

        zoom = d3.zoom().on("zoom", zoomed);
        svg.call(zoom);
    }

    /**
     * Applies drag functionality to element.
     * @param element element reference.
     * @param node graph node object.
     * @param graph force directed graph object.
     */
    applyDraggableBehaviour(element, node: GraphNode, graph: ForceDirectedGraph) {
        const d3element = d3.select(element);

        function started() {
            d3.event.sourceEvent.stopPropagation();

            if (!d3.event.active) {
                graph.simulation.alphaTarget(0.3).restart();
            }

            d3.event.on("drag", dragged).on("end", ended);
            //Enable for touchscreen
            try {
                d3.event.on("touchmove", dragged).on("touchend", ended);
            } catch (e) {
                //ignore
            }

            function dragged() {
                node.fx = d3.event.x;
                node.fy = d3.event.y;
            }

            function ended() {
                if (!d3.event.active) {
                    graph.simulation.alphaTarget(0);
                }
                node.fx = null;
                node.fy = null;
            }
        }

        d3element.call(d3.drag().on("start", started));
        //Enable for touchscreen
        try {
            d3element.call(d3.drag().on("touchstart", started));
        }
        catch (e) { }

    }

    /**
     * Returns a new force directed graph object.
     * @param nodes list of graph nodes.
     * @param links list of graph links.
     * @param options options for specifying simulation dimensions.
     */
    getForceDirectedGraph(nodes: GraphNode[], links: GraphLink[], options: { width, height }) {
        let graph = new ForceDirectedGraph(nodes, links, options);
        return graph;
    }

}