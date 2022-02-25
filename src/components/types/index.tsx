interface UserRecordType {
  '@rid'?: string;
  '@class'?: string;
  uuid?: string;
  createdAt?: number;
  deletedAt?: number;
}

/**
 * Represents a general record type from schema
 */
interface GeneralRecordType extends UserRecordType {
  createdBy?: UserRecordType;
  name?: string;
  displayName?: string;
}

/**
 * Represents general format of a statement class record
 */
interface StatementType extends GeneralRecordType {
  conditions: GeneralRecordType[];
  evidence: GeneralRecordType[];
  relevance: GeneralRecordType;
  subject: GeneralRecordType;
}

export type {
  GeneralRecordType, StatementType, UserRecordType,
};
