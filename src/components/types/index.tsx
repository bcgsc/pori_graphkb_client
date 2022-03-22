import PropTypes from 'prop-types';
/**
 * @typedef {Object} User model proptype
 */
const UserPropType = PropTypes.shape({
  '@rid': PropTypes.string,
  '@class': PropTypes.string,
  uuid: PropTypes.string,
  createdAt: PropTypes.number,
  deletedAt: PropTypes.number,
});

const BASE_PROPERTIES = {
  '@rid': PropTypes.string,
  '@class': PropTypes.string,
  uuid: PropTypes.string,
  createdAt: PropTypes.number,
  deletedAt: PropTypes.number,
  createdBy: UserPropType,
  name: PropTypes.string,
  displayName: PropTypes.string,
};

/**
 * Represents a general record type from schema
 */
const GeneralRecordPropType = PropTypes.shape({
  ...BASE_PROPERTIES,
});

/**
 * Represents general format of a statement class record
 */
const StatementPropType = PropTypes.shape({
  ...BASE_PROPERTIES,
  conditions: PropTypes.arrayOf(PropTypes.shape({
    ...BASE_PROPERTIES,
  })),
  evidence: PropTypes.arrayOf(PropTypes.shape({
    ...BASE_PROPERTIES,
  })),
  relevance: PropTypes.shape({
    ...BASE_PROPERTIES,
  }),
  subject: PropTypes.shape({
    ...BASE_PROPERTIES,
  }),
});

const LocationPropType = PropTypes.shape({
  hash: PropTypes.string,
  key: PropTypes.string,
  pathname: PropTypes.string,
  search: PropTypes.string,
});

const HistoryPropType = PropTypes.shape({
  createHref: PropTypes.func,
  goBack: PropTypes.func,
  location: LocationPropType,
  push: PropTypes.func,
  replace: PropTypes.func,
});

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

type GeneralRecordType<ReqFields extends keyof TGeneralRecordType = never> = Required<Pick<TGeneralRecordType, ReqFields>> & Omit<TGeneralRecordType, ReqFields>;

/**
 * Represents general format of a statement class record
 */
interface StatementType extends GeneralRecordType {
  conditions: GeneralRecordType[];
  evidence: GeneralRecordType[];
  relevance: GeneralRecordType;
  subject: GeneralRecordType;
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
  } | unknown[] | string,
  filters?: Record<string, unknown> | Record<string, unknown>[];
  returnProperties?: ReqFields[];
  neighbors?: number;
  limit?: number;
  orderBy?: string[];
  orderByDirection?: 'DESC' | 'ASC';
}

export {
  GeneralRecordPropType,
  HistoryPropType,
  LocationPropType,
  StatementPropType,
};

export type {
  GeneralRecordType,
  QueryBody,
  StatementType,
};
