import './index.scss';

import React from 'react';

/* eslint-disable react/no-array-index-key */

interface IndentProps {
  level: number;
}

const Indent = ({ level }: IndentProps) => (
  <pre className={`json-view__indent json-view__indent--level-${level}`}>{'  '.repeat(level)}</pre>
);

interface ValueViewProps {
  value: unknown;
  ValueComponent: ({ value }) => JSX.Element;
  name?: string;
  level: number;
}

const ValueView = ({
  name, value, ValueComponent, ...rest
}: ValueViewProps) => (
  <div>
    <Indent {...rest} />
    <span>
      {name && (`${name}: `)} <ValueComponent value={value} />
    </span>
  </div>
);

ValueView.defaultProps = {
  name: '',
};

interface ObjectViewProps {
  data: Parameters<typeof Object.entries>[0]
  closingBrace?: string;
  level: number;
  ValueComponent: ({ value }) => JSX.Element;
}

const ObjectView = ({
  data, level, closingBrace, ...rest
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
            <ObjectView {...rest} key={key} data={value as Record<string, unknown>} level={level + 1} />
          </>
        );
      }
      return (<ValueView {...rest} key={key} level={level + 1} name={key} value={value} />);
    })}
    <div><Indent {...rest} level={level} /><span>{closingBrace}</span></div>
  </>
);

ObjectView.defaultProps = {
  closingBrace: '}',
};

interface ArrayViewProps {
  data: unknown[];
  closingBrace?: string;
  level: number;
  ValueComponent: ({ value }) => JSX.Element;
}

const ArrayView = ({
  data, level, closingBrace, ...rest
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
            <ObjectView {...rest} key={key} data={value as Record<string, unknown>} level={level + 1} />
          </>
        );
      }
      return (<ValueView {...rest} key={key} level={level + 1} value={value} />);
    })}
    <div><Indent {...rest} level={level} /><span>{closingBrace}</span></div>
  </>
);

ArrayView.defaultProps = {
  closingBrace: ']',
};

interface JSONViewProps {
  data: Parameters<typeof Object.entries>[0];
  ValueComponent: ({ value }) => JSX.Element;
}

const JSONView = (props: JSONViewProps) => (
  <>
    <div><span>{'{'}</span></div>
    <ObjectView {...props} level={0} />
  </>
);

export default JSONView;
