/* eslint-disable @typescript-eslint/no-use-before-define */
import './index.scss';

import React from 'react';

interface IndentProps {
  indent?: string;
  level?: number;
}

/* eslint-disable react/no-array-index-key */

function Indent(props: IndentProps) {
  const { level = 0, indent = '  ' } = props;
  return <pre className={`json-view__indent json-view__indent--level-${level}`}>{indent.repeat(level)}</pre>;
}

Indent.defaultProps = {
  indent: '  ',
  level: 0,
};

const DefaultValueComponent: React.FunctionComponent<{ value: unknown }> = ({ value }) => JSON.stringify(value);

interface ValueViewProps extends IndentProps {
  value: unknown;
  ValueComponent?: React.FunctionComponent<{ value: unknown }>;
  name?: string;
}

function ValueView(props: ValueViewProps): JSX.Element {
  const {
    name,
    value,
    ValueComponent = DefaultValueComponent,
    ...rest
  } = props;

  return (
    <div>
      <Indent {...rest} />
      <span>
        {name && (`${name}: `)} <ValueComponent value={value} />
      </span>
    </div>
  );
}

ValueView.defaultProps = {
  name: '',
  ValueComponent: DefaultValueComponent,
  indent: '  ',
  level: 0,
};

interface ObjectViewProps {
  data: object;
  closingBrace?: string;
  level?: number;
}

function ObjectView(props: ObjectViewProps): JSX.Element {
  const {
    data,
    level = 0,
    closingBrace,
    ...rest
  } = props;

  return (
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
}

ObjectView.defaultProps = {
  level: 0,
  closingBrace: '}',
};

interface ArrayViewProps {
  data: unknown[];
  closingBrace?: string;
  level?: number;
}

function ArrayView(props: ArrayViewProps): JSX.Element {
  const {
    data,
    level = 0,
    closingBrace,
    ...rest
  } = props;

  return (
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
}

ArrayView.defaultProps = {
  level: 0,
  closingBrace: ']',
};

function JSONView(props): JSX.Element {
  return (
    <>
      <div><span>{'{'}</span></div>
      <ObjectView {...props} />
    </>
  );
}

export default JSONView;
