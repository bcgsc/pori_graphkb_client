import './index.scss';

import { variant } from '@bcgsc/knowledgebase-parser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';


const NotationParser = () => {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      setParsed(variant.parse(text));
      setError(null);
    } catch (err) {
      setParsed(null);
      setError(err);
    }
  }, [text]);

  const handleNotationChange = ({ target: { value } }) => {
    setText(value);
    setIsDirty(true);
  };

  const content = {};

  Object.keys(parsed || {}).forEach((col) => {
    if (typeof parsed[col] === 'object' && parsed[col] !== null) {
      Object.keys(parsed[col]).forEach((key) => {
        content[`${col}.${key}`] = parsed[col][key];
      });
    } else {
      content[col] = parsed[col];
    }
  });

  const header = Object.keys(content).sort().filter(col => content[col]);

  return (
    <div className="notation-parser">
      <TextField
        className="notation-parser__input"
        error={Boolean(isDirty && error)}
        fullWidth
        helperText={(isDirty && error && error.message) || 'Input notation to be parsed'}
        InputLabelProps={{ shrink: !!text }}
        label="notation"
        name="notation"
        onChange={handleNotationChange}
        value={text || ''}
      />
      {parsed && (
      <Table className="notation-parser__results" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>Parsed Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {header.map(col => (
            <TableRow key={col}>
              <TableCell>{col}</TableCell>
              <TableCell>{content[col]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
    </div>
  );
};

export default NotationParser;
