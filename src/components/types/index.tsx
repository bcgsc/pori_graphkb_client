/**
 * Represents a general record type from schema
 */
interface TGeneralRecordType {
  '@rid'?: string;
  '@class'?: string;
  uuid?: string;
  createdAt?: number;
  deletedAt?: number;
  updatedAt?: number;
  createdBy?: TGeneralRecordType;
  name?: string;
  displayName?: string;
  [key: `out_${string}` | `in_${string}`]: unknown[] | undefined;
  [key: string]: unknown | undefined;
}

type GeneralRecordType<ReqFields extends keyof TGeneralRecordType = never> =
  Required<Pick<TGeneralRecordType, ReqFields>> &
  Omit<TGeneralRecordType, ReqFields>;

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
  out: GeneralRecordType<'uuid'>['uuid'];
  source: GeneralRecordType<'@rid' | '@class'>;
}

/**
 * body of request sent to /query endpoint
 */
interface QueryBody<ReqFields extends string = string> {
  queryType?: string;
  target?: {
    queryType: string;
    target: string;
    filters: Record<string, unknown>;
  } | string[] | string,
  filters?: Record<string, unknown> | Record<string, unknown>[];
  returnProperties?: ReqFields[];
  neighbors?: number;
  limit?: number;
  orderBy?: string[];
  orderByDirection?: 'DESC' | 'ASC';
}

export type {
  EdgeType,
  GeneralRecordType,
  QueryBody,
  StatementType,
};
