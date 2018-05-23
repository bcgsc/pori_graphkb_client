/**
 * Disease term data type as returned by the API.
 */
export interface DiseaseTerm {
    '@class': string;
    sourceId: string;
    createdBy: string;
    name?: string;
    description?: string;
    source: string;
    '@rid': string;
    '@version': number;
    longName?: number;
    subsets?: string[];
    parents?: string[];
    children?: string[];
    _children?: DiseaseTerm[];
    aliases?: string[];
}
/**
 * Disease payload definition for POST and PATCH requests.
 */
export interface DiseasePayload {
    source: string;
    sourceId: string;
    name?: string;
    longName?: string;
    description?: string;
    subsets?: string[];
    sourceVersion?: string;
    sourceIdVersion?: string;
}

/**
 * Disease parameters for GET requests.
 */
export interface DiseaseParams {
    name?: string,
    source?: string,
    sourceId?: string,
    sourceVersion?: string,
    longName?: string,
    sourceIdVersion?: string,
    limit?: number,
    returnProperties?: string,
    ancestors?: string,
    descendants?: string,
    fuzzyMatch?: number,
    neighbors?: number
}