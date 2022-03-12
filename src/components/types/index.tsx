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

export {
  GeneralRecordPropType,
  LocationPropType,
  HistoryPropType,
  StatementPropType,
};
