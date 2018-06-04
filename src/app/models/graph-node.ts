import { Ontology } from ".";

export class GraphNode implements d3.SimulationNodeDatum{
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;

    id: string;
    data: Ontology;
    linkCount: number = 0;
    r = 4;

    constructor(id, data){
        this.id = id;
        this.data = data;
    }
}
