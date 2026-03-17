import './index.scss';

import React from 'react';

/* eslint-disable react/no-array-index-key */

interface IndentProps {
  indent?: string;
  level?: number;
}

const Indent = ({ level = 0, indent = '  ' }: IndentProps) => (
  <pre className={`json-view__indent json-view__indent--level-${level}`}>{indent.repeat(level)}</pre>
);

const DefaultValueComponent = ({ value }) => JSON.stringify(value);

interface ValueViewProps {
  value: unknown;
  ValueComponent?: ({ value }) => JSX.Element;
  name?: string;
}

const ValueView = ({
  name = '', value, ValueComponent = DefaultValueComponent, ...rest
}: ValueViewProps) => (
  <div>
    <Indent {...rest} />
    <span>
      {name && (`${name}: `)} <ValueComponent value={value} />
    </span>
  </div>
);

interface ObjectViewProps {
  data: Record<string, unknown>;
  // eslint-disable-next-line react/require-default-props
  closingBrace?: string;
  // eslint-disable-next-line react/require-default-props
  level?: number;
}

const ObjectView = ({
  data, level = 0, closingBrace = '}', ...rest
}: ObjectViewProps) => (
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

interface ArrayViewProps {
  data: unknown[];
  closingBrace?: string;
  level?: number;
}

const ArrayView = ({
  data, level = 0, closingBrace = ']', ...rest
}: ArrayViewProps) => (
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

const JSONView = (props: ObjectViewProps) => (
  <>
    <div><span>{'{'}</span></div>
    <ObjectView {...props} />
  </>
);

export default JSONView;
