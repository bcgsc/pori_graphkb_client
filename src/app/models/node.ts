export class Node implements d3.SimulationNodeDatum{
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;

    id: string;
    name: string;
    linkCount: number = 0;
    r = 4;

    constructor(id, name){
        this.id = id;
        this.name = name;
    }
}
