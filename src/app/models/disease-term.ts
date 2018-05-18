export class DiseaseTerm {
    rid: string;
    uuid: string;
    version: number;
    createdBy: string;
    createdAt: Date;
    sourceId: string;
    source: string;
    name?: string;
    description?: string;
    deletedBy?: string;
    deletedAt?: Date;
    sourceVersion?: string;
    sourceIdVersion?: string;
    subsets?: string[];
    out_SubClassOf?: Edge[];
    in_SubClassOf?: Edge[];
    in_AliasOf?: Edge[];
    out_AliasOf?: Edge[];

    constructor(json: JSON) {
        this.rid = json['@rid'];
        this.uuid = json['uuid'];
        this.version = json['@version'];
        this.createdBy = json['createdBy']['name'];
        this.createdAt = new Date(json['createdAt']);
        this.source = json['source'];
        this.sourceId = json['sourceId'];;

        this.name = json['name'] || null;
        this.description = json['description'] || null;
        this.deletedBy = json['deletedBy']['name'] || null;
        this.deletedAt = new Date(json['deletedAt']) || null;
        this.sourceVersion = json['sourceVersion'] || null;
        this.sourceIdVersion = json['sourceIdVersion'] || null;
        this.subsets = json['subsets'];


        if (json['out_SubClassOf']) { 
            this.out_SubClassOf = []; 
            json['out_SubClassOf'].forEach(edge => this.out_SubClassOf.push(new Edge(edge))); 
        }
        if (json['in_SubClassOf']) {
            this.in_SubClassOf = [];
            json['in_SubClassOf'].forEach(edge => this.in_SubClassOf.push(new Edge(edge)));
        }
        if (json['out_AliasOf']) {
            this.out_AliasOf = [];
            json['out_AliasOf'].forEach(edge => this.out_AliasOf.push(new Edge(edge)));
        }
        if (json['in_AliasOf']) {
            this.in_AliasOf = [];
            json['in_AliasOf'].forEach(edge => this.in_AliasOf.push(new Edge(edge)));
        }

    }

    /**
     * Returns list of children RID's
     */
    getChildren(): string[] {
        let children = [];
        this.in_SubClassOf.forEach(edge => children.push(edge.out));
        return children;
    }

    /**
     * Returns list of parent RID's
     */
    getParents(): string[] {
        let parents = [];
        this.out_SubClassOf.forEach(edge => parents.push(edge.in));
        return parents;
    }

    /**
     * Returns list of alias RID's
     */
    getAliases(): string[] { 
        let aliases = [];
        this.out_AliasOf.forEach(edge => aliases.push(edge.in));
        this.in_AliasOf.forEach(edge=>aliases.push(edge.out));
        return aliases;
    }

}

export class Edge {
    rid: string;
    uuid: string;
    class: string;
    version: number;
    createdBy: string;
    createdAt: Date;
    // rid's
    in: string;
    out: string;

    constructor(json: JSON) {
        this.rid = json['@rid'];
        this.uuid = json['uuid'];
        this.class = json['@class'];
        this.version = json['@version'];
        this.createdBy = json['createdBy']['name'];
        this.createdAt = new Date(json['createdAt']);

        this.in = json['in']['@rid'] || json['in'];
        this.out = json['out']['@rid'] || json['out'];
    }
}
