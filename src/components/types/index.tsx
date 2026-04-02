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
  createdBy: TGeneralRecordType | string;
  [key: `out_${string}` | `in_${string}`]: unknown[] | undefined;

  // add other properties that exist on any record type
  comment: string;
  status: string | number | boolean;
  break1Start: Partial<TGeneralRecordType>;
  break1End: Partial<TGeneralRecordType>;
  source: Partial<TGeneralRecordType>;
  sourceId: string;
  reviews: unknown[];
  email: string;
  journalName: string;
  description: string;
  germline: boolean;
  subsets: unknown;
  evidence: Partial<TGeneralRecordType>[];
  zygosity: string;

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
  in: GeneralRecordType<'@rid' | '@class'>;
  out: GeneralRecordType<'@rid' | '@class'>;
  source: GeneralRecordType<'@rid' | '@class'>;
}

interface FilterType {
  query?: unknown;
  AND?: FilterType[];
  OR?: FilterType[];
  [key: string]: unknown;
}

/**
 * body of request sent to /query endpoint
 */
interface QueryBody<ReqFields extends string = string> {
  queryType?: string;
  target?: {
    queryType: string;
    target: string;
    filters: FilterType;
  } | string[] | string,
  filters?: FilterType | FilterType[];
  returnProperties?: ReqFields[];
  neighbors?: number;
  limit?: number;
  skip?: number;
  orderBy?: string[] | string;
  orderByDirection?: 'DESC' | 'ASC';
  count?: boolean;
}

export type {
  EdgeType,
  FilterType,
  GeneralRecordType,
  QueryBody,
  StatementType,
};
