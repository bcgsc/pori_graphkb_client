import { GraphNode } from './graph-node';

export class GraphLink implements d3.SimulationLinkDatum<GraphNode>{
    index?: number;

    source: GraphNode | string | number;
    target: GraphNode | string | number;
    type: string;

    constructor(source, target, type){
        this.source = source;
        this.target = target;
        this.type = type;
    }
}