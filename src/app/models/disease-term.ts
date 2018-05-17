export class DiseaseTerm {
    rid: string;
    uuid: string;    
    class: string;
    version: number;
    createdBy: string;
    createdAt: number;
    sourceId: string;
    source: string;
    name?: string;
    description?: string;
    deletedBy?: string;
    deletedAt?: string;
    sourceVersion?: string;
    sourceIdVersion?: string;
    subsets?: string[];
    out_SubClassOf?: Edge;
    in_SubClassOf?: Edge;
    in_AliasOf?: Edge;
    out_AliasOf?: Edge;
}

export class Edge{
    rid: string;
    uuid: string;    
    class: string;
    version: number;
    createdBy: string;
    createdAt: number;
    // rid's
    in: string;
    out: string;
}
