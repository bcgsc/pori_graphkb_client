/**
 * Represents a general record type from schema
 */
interface TGeneralRecordType {
  '@rid': string;
  '@class': string;
  uuid: string;
  createdAt: number;
  deletedAt: number;
  updatedAt: number;
  name: string;
  displayName: string;
  displayNameTemplate: string;
  createdBy: Partial<TGeneralRecordType> | string;
  updatedBy: Partial<TGeneralRecordType> | string;
  [key: `out_${string}` | `in_${string}`]: unknown[] | undefined;

  // add other properties that exist on any record type
  comment: string;
  status: string | number | boolean;
  break1Start: Partial<TGeneralRecordType>;
  break1End: Partial<TGeneralRecordType>;
  break2Start: Partial<TGeneralRecordType>;
  break2End: Partial<TGeneralRecordType>;
  source: Partial<TGeneralRecordType>;
  sourceId: string;
  reviews: unknown[];
  email: string;
  journalName: string;
  reference1: Partial<TGeneralRecordType> | string;
  reference2: Partial<TGeneralRecordType> | string | null;
  germline: boolean;
  type: Partial<TGeneralRecordType> | string;
  deprecated: boolean;
  firstLoginAt: number;
  signedLicenseAt: number | null;
  lastLoginAt: number;
  groups: string[] | Partial<TGeneralRecordType>[];
  loginCount: number;
  alias: boolean;
  dependency: null;
  usage: string;
  url: string;
  sort: number;
  description: string;
  biotype: string;
  longName: string;
  shortName: string;
  untemplatedSeq: string;
  refSeq: string;
  break1Repr: string;
  pos: number;
  refAA: string;

  count: number;
}

type GeneralRecordType<ReqFields extends string = never> =
  Pick<TGeneralRecordType, ReqFields & keyof TGeneralRecordType> &
  Partial<TGeneralRecordType>;

/**
 * Represents general format of a statement class record
 */
interface StatementType extends GeneralRecordType {
  conditions: GeneralRecordType[];
  evidence: GeneralRecordType[];
  relevance: GeneralRecordType;
  subject: GeneralRecordType;
}

interface EdgeType extends GeneralRecordType<'@rid'> {
  in: GeneralRecordType<'@rid' | '@class'> | string;
  out: GeneralRecordType<'@rid' | '@class'> | string;
  source: GeneralRecordType<'@rid' | '@class'>;
}

type RecordId = string;

type QueryTarget = string | RecordId[] | SubQuery | FixedSubQuery;

export type ComparisonOperator =
  | 'CONTAINS'
  | 'CONTAINSALL'
  | 'CONTAINSANY'
  | 'CONTAINSTEXT'
  | '='
  | '>'
  | '>='
  | 'IN'
  | 'INSTANCEOF'
  | 'IS'
  | '<'
  | '<=';

type FilterValue =
  | boolean
  | string
  | string[]
  | number
  | number[]
  | null
  | FixedSubQuery
  | SubQuery;

type Comparison = {
  operator?: ComparisonOperator;
  negate?: boolean;
  AND?: never;
  OR?: never;
} & {
  [property: string]: FilterValue | undefined;
};

type FilterType =
  | Comparison
  | { AND: FilterType[]; OR?: never }
  | { OR: FilterType[]; AND?: never };

type NeighborhoodDirection = 'out' | 'in' | 'both';

type QueryEdge =
  | 'AliasOf'
  | 'Cites'
  | 'CrossReferenceOf'
  | 'DeprecatedBy'
  | 'ElementOf'
  | 'GeneralizationOf'
  | 'Infers'
  | 'SubClassOf'
  | 'TargetOf'
  | 'OppositeOf';

interface KeywordQuery {
  keyword: string;
  queryType: 'keyword';
  target: string;
  operator?: '=' | 'CONTAINSTEXT';
}

interface DisplayNameQuery {
  keyword: string;
  queryType: 'displayName';
  target: string;
}

interface NeighborhoodQuery {
  queryType: 'neighborhood';
  target: QueryTarget;
  filters: FilterType;
  depth?: number;
  direction?: NeighborhoodDirection;
  edges?: QueryEdge[];
}

interface TreeQuery {
  queryType: 'ancestors' | 'descendants';
  target: string | RecordId[];
  filters?: FilterType;
  disambiguate?: boolean;
  edges?: QueryEdge[];
}

interface SimilarityQuery {
  queryType: 'similarTo';
  target: QueryTarget;
  edges?: QueryEdge[];
  treeEdges?: QueryEdge[];
}

type FixedSubQuery =
  | KeywordQuery
  | DisplayNameQuery
  | NeighborhoodQuery
  | TreeQuery
  | SimilarityQuery;

interface SubQuery {
  target: QueryTarget;
  queryType?: never;
  keyword?: never;
  filters?: FilterType | FilterType[];
}

interface QueryOptions<ReqFields extends string = string> {
  count?: boolean;
  limit?: number;
  skip?: number | null;
  orderBy?: string[] | string;
  orderByDirection?: 'DESC' | 'ASC';
  returnProperties?: ReqFields[];
  neighbors?: number;
  history?: boolean;
}

/**
 * body of a request sent to the /query endpoint
 */
type QueryBody<ReqFields extends string = string> = QueryOptions<ReqFields> & (SubQuery | FixedSubQuery);

export type {
  EdgeType,
  FilterType,
  GeneralRecordType,
  QueryBody,
  StatementType,
};
