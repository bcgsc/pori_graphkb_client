import { Node } from './node';

export class Link implements d3.SimulationLinkDatum<Node>{
    index?: number;

    source: Node | string | number;
    target: Node | string | number;
    type: string;

    constructor(source, target, type){
        this.source = source;
        this.target = target;
    }
}