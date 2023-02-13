import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';

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
  createdBy: GeneralRecordType;
  name: string;
  displayName: string;
  in: GeneralRecordType | string;
  out: GeneralRecordType | string;
  source: GeneralRecordType | string;
  sourceId: string;
  journalName: string;
  conditions: GeneralRecordType[];
  evidence: GeneralRecordType[];
  relevance: GeneralRecordType;
  subject: GeneralRecordType;
  count: number;
  comment: string;
  [key: `out_${string}` | `in_${string}`]: (GeneralRecordType | string)[] | undefined;
  [key: string]: unknown | undefined;
}

type GeneralRecordType<ReqFields extends keyof TGeneralRecordType = '@rid'> = Pick<TGeneralRecordType, '@rid'> & Pick<TGeneralRecordType, ReqFields> & Partial<TGeneralRecordType>;

/**
 * Represents general format of a statement class record
 */
type StatementType = GeneralRecordType<'@rid' | 'conditions' | 'evidence' | 'relevance' | 'subject'>;

interface QueryFilter {
  name?: string;
  OR?: QueryFilter[];
  AND?: QueryFilter[];
  queryType?: string;
  keyword?: string;
  target?: string;
  query?: QueryFilter;
  [key: string]: unknown | undefined;
  operator?: string;
}

/**
 * body of request sent to /query endpoint
 */
interface QueryBody<ReqFields extends string = string> {
  queryType?: string;
  target?: {
    queryType: string;
    target: string;
    filters: QueryFilter;
  } | string[] | string,
  filters?: QueryFilter | QueryFilter[];
  treeEdges?: string[];
  returnProperties?: ReqFields[] | readonly ReqFields[];
  neighbors?: number;
  limit?: number;
  orderBy?: string[] | string;
  orderByDirection?: 'DESC' | 'ASC';
  count?: boolean;
  skip?: number;
}

type ModelDefinition = NonNullable<ReturnType<(typeof schemaDefn)['get']>>;
type PropertyDefinition = ModelDefinition['properties'][string];

export type {
  GeneralRecordType,
  ModelDefinition,
  PropertyDefinition,
  QueryBody,
  QueryFilter,
  StatementType,
};
