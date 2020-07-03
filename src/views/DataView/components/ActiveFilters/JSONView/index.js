import './index.scss';

import PropTypes from 'prop-types';
import React from 'react';

/* eslint-disable react/no-array-index-key */

const Indent = ({ level, indent }) => (
  <pre className={`json-view__indent json-view__indent--level-${level}`}>{indent.repeat(level)}</pre>
);

Indent.propTypes = {
  indent: PropTypes.string,
  level: PropTypes.number,
};

Indent.defaultProps = {
  indent: '  ',
  level: 0,
};

const DefaultValueComponent = ({ value }) => JSON.stringify(value);

const ValueView = ({
  name, value, ValueComponent, ...rest
}) => (
  <div>
    <Indent {...rest} />
    <span>
      {name}: <ValueComponent value={value} />
    </span>
  </div>
);


ValueView.propTypes = {
  value: PropTypes.any.isRequired,
  ValueComponent: PropTypes.func,
  name: PropTypes.string,
};


ValueView.defaultProps = {
  name: '',
  ValueComponent: DefaultValueComponent,
};

const ObjectView = ({
  data, level, closingBrace, ...rest
}) => (
  <>
    {Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return (<div><Indent {...rest} level={level + 1} /><span>{key}: []</span></div>);
        } if (value.length === 1 && Array.isArray(value[0])) {
          return (
            <>
              <div><Indent {...rest} level={level + 1} /><span>{key}: [[</span></div>
              <ArrayView {...rest} key={key} closingBrace="]]" data={value[0]} level={level + 1} />
            </>
          );
        } if (value.length === 1 && value[0] && typeof value[0] === 'object') {
          return (
            <>
              <div><Indent {...rest} level={level + 1} /><span>{key}: {'[{'}</span></div>
              <ObjectView {...rest} key={key} closingBrace="}]" data={value[0]} level={level + 1} />
            </>
          );
        }
        return (
          <>
            <div><Indent {...rest} level={level + 1} /><span>{key}: [</span></div>
            <ArrayView {...rest} key={key} data={value} level={level + 1} />
          </>
        );
      } if (value && typeof value === 'object') {
        return (
          <>
            <div><Indent {...rest} level={level + 1} /><span>{key}:{' {'}</span></div>
            <ObjectView {...rest} key={key} data={value} level={level + 1} />
          </>
        );
      }
      return (<ValueView {...rest} key={key} level={level + 1} name={key} value={value} />);
    })}
    <div><Indent {...rest} level={level} /><span>{closingBrace}</span></div>
  </>
);

ObjectView.propTypes = {
  data: PropTypes.object.isRequired,
  closingBrace: PropTypes.string,
  level: PropTypes.number,
};

ObjectView.defaultProps = {
  level: 0,
  closingBrace: '}',
};


const ArrayView = ({
  data, level, closingBrace, ...rest
}) => (
  <>
    {data.map((value, key) => {
      if (Array.isArray(value)) {
        return (
          <>
            <div><Indent {...rest} level={level + 1} /><span>[</span></div>
            <ArrayView {...rest} key={key} data={value} level={level + 1} />
          </>
        );
      } if (value && typeof value === 'object') {
        return (
          <>
            <div><Indent {...rest} level={level + 1} /><span>{'{'}</span></div>
            <ObjectView {...rest} key={key} data={value} level={level + 1} />
          </>
        );
      }
      return (<ValueView {...rest} key={key} level={level + 1} value={value} />);
    })}
    <div><Indent {...rest} level={level} /><span>{closingBrace}</span></div>
  </>
);

ArrayView.propTypes = {
  data: PropTypes.array.isRequired,
  closingBrace: PropTypes.string,
  level: PropTypes.number,
};

ArrayView.defaultProps = {
  level: 0,
  closingBrace: ']',
};

const JSONView = props => (
  <>
    <div><span>{'{'}</span></div>
    <ObjectView {...props} />
  </>
);

export default JSONView;
