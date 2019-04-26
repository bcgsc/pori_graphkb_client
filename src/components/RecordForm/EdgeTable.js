/**
 * @module /components/RelationshipsForm
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';

import DetailChip from '../DetailChip';
import { withKB } from '../KBContext';


/**
 * Give some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 *
 * @param {object} props
 * @param {function} props.itemToKey the function to create a uique key for each egde record
 * @param {string} props.sourceNodeId the ID of the node we are summarizing relationships for
 * @param {Array.<object>} props.values the edge records
 * @param {Schema} props.schema the schema object (from context)
 */
const EdgeTable = (props) => {
  const {
    itemToKey,
    schema,
    sourceNodeId,
    values,
  } = props;

  const EdgeRow = (value) => {
    const key = itemToKey(value);

    const model = schema.get(value);

    let target = 'out';

    if (value.in && value.out) {
      const outRID = value.out
        ? value.out['@rid']
        : value.out;

      target = outRID !== sourceNodeId
        ? 'out'
        : 'in';
    } else if (value.in) {
      target = 'in';
    }

    const reversed = (target === 'out');

    const details = {};
    Object.keys(value[target]).filter(
      name => !name.startsWith('out_') && !name.startsWith('in_'),
    ).forEach((name) => {
      details[name] = value[target][name];
    });

    return (
      <React.Fragment key={key}>
        <TableRow>
          <TableCell padding="dense">
            {reversed
              ? model.reverseName
              : model.name
            }
          </TableCell>
          <TableCell>
            <DetailChip
              label={schema.getLabel(value[target])}
              details={details}
              valueToString={
                (record) => {
                  if (record && record['@rid']) {
                    return record['@rid'];
                  }
                  return `${record}`;
                }
              }
              getLink={schema.getLink}
            />
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  return (
    <div className="edge-table">
      <Table className="edge-table__table">
        <TableHead
          className="edge-table__table-header"
        >
          <TableRow>
            <TableCell padding="dense">
              Relationship Class
            </TableCell>
            <TableCell padding="dense">
              Related Record
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { values.map(EdgeRow) }
        </TableBody>
      </Table>
    </div>
  );
};

EdgeTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
  itemToKey: PropTypes.func,
  sourceNodeId: PropTypes.string,
  schema: PropTypes.object.isRequired,
};

EdgeTable.defaultProps = {
  values: [],
  itemToKey: item => item['@rid'],
  sourceNodeId: null,
};

export default withKB(EdgeTable);
