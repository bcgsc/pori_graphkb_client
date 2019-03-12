import React, { Component } from 'react';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';

import './CodeInput.scss';
import config from '../../../../static/config';

const LINE_HEIGHT_PX = 20;
const COMMENT_REGEX = /\/\/.*(?!\\n)/g;

const { NODE_COLORS } = config.GRAPH_DEFAULTS;

const regexify = str => str.replace(/[.+*^()\\\][$]/g, match => `\\${match}`);
const findLineIndex = (value, index) => {
  let tempIndex = 0;
  value.split('').findIndex((char, i) => {
    if (char === '\n' && i >= index) {
      return true;
    }
    if (char === '\n') {
      tempIndex = i;
    }
    return false;
  });
  return tempIndex + 1;
};

/**
 * Component for multicolored inputs. Defaults to recognizing "// ... " comment
 * string format, but can have additional regexes added to recognize and color
 * other patterns. Requires MONOSPACE FONT in order to properly align different
 * colored layers properly.
 * @property {object} props
 * @property {string} props.value - textarea value
 * @property {Object} props.style - style prop to be applied to the base textarea component.
 * @property {string} props.className - Class name prop applied to base textarea component.
 * @property {Array.<Object>} props.rules - List of formatting rules for the component.
 * @property {string} props.rules.regex - Matching regex that is applied to the text.
 * IMPORTANT: will only match the LAST capture group defined in the regex.
 * Using 'g' flag is recommended.
 * @property {string} props.rules.color - Color to color matches with.
 * @property {string} props.rules.className - Class name prop applied to matched textarea.
 * @property {Function} props.onChange
 */
class CodeInput extends Component {
  static propTypes = {
    value: PropTypes.string,
    style: PropTypes.objectOf(PropTypes.string),
    className: PropTypes.string,
    rules: PropTypes.arrayOf(
      PropTypes.shape({
        regex: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)]),
        color: PropTypes.string,
        className: PropTypes.string,
      }),
    ),
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
    style: {},
    className: '',
    rules: [{ regex: COMMENT_REGEX, color: 'green', className: '' }],
  };

  constructor(props) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.ruleTextRefs = [];
  }

  /**
   * Synchronizes scrolling between all rule layers.
   */
  @boundMethod
  handleScroll() {
    this.ruleTextRefs.forEach((r) => {
      r.scrollTop = this.typeTextRef.scrollTop;
      r.scrollLeft = this.typeTextRef.scrollLeft;
    });
    this.textRef.scrollTop = this.typeTextRef.scrollTop;
    this.textRef.scrollLeft = this.typeTextRef.scrollLeft;
  }

  @boundMethod
  handleTab(event) {
    const { onChange } = this.props;
    let { value } = event.target;
    const { selectionStart, selectionEnd } = event.target;
    let newCursor;
    let changed = false;

    // TAB key
    if (event.keyCode === 9) {
      changed = true;

      if (event.shiftKey) {
        const lineIndex = findLineIndex(value, selectionStart);
        let tempIndex;
        value.slice(lineIndex, lineIndex + 5).split('').some((char, i) => {
          tempIndex = i;
          if (char.trim() || i === 4) {
            return true;
          }
          return false;
        });
        value = `${value.slice(0, lineIndex)}${value.slice(lineIndex + tempIndex)}`;
        newCursor = selectionStart - tempIndex;
      } else {
        value = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
        newCursor = selectionStart + 4;
      }
      // BACKSPACE key
    } else if (event.keyCode === 8 && event.ctrlKey) {
      const oldLength = value.length;
      value = `${value.slice(0, selectionStart).trim()}${value.slice(selectionStart)}`;
      newCursor = selectionStart + (value.length - oldLength);
      if (value.length - oldLength !== 0) {
        changed = true;
      }
      // DELETE key
    } else if (event.keyCode === 46 && event.ctrlKey) {
      const index = value.slice(selectionStart).split('').findIndex((char) => {
        if (char.trim() || char === '\n') {
          return true;
        }
        return false;
      });
      if (index !== 0) {
        changed = true;
        value = `${value.slice(0, selectionStart)}${value.slice(selectionStart + index)}`;
        newCursor = selectionStart;
      }
    }

    if (changed) {
      event.preventDefault();
      onChange({ target: { value } });
      setTimeout(() => {
        this.typeTextRef.selectionStart = newCursor;
        this.typeTextRef.selectionEnd = newCursor;
      }, 0);
    }
  }

  render() {
    const {
      value,
      style,
      className,
      rules,
      ...other
    } = this.props;

    let text = value;
    const numLines = value.split('\n').length;
    const ruleVals = [];
    // For each rule, create a colored layer with matched text.
    rules.forEach((rule) => {
      const { regex } = rule;

      // Replace all characters with whitespace, but keep newline positions
      let ruleMatch = value.replace(/[^\s]/g, ' ');

      // Cycle through all instances of pattern
      let match = regex.exec(value);
      while (match) {
        // Calculates additional offset within the total match and the intended
        // capture group.
        const offset = match[0].match(regexify(match[match.length - 1])).index;
        const index = match.index + offset;

        // Prepares whitespace for replacing position in main text layer.
        const { length } = match[match.length - 1];
        let spaces = '';
        for (let i = 0; i < length; i += 1) spaces += ' ';

        // Fills in matched text in its designated color layer.
        ruleMatch = `${ruleMatch.slice(0, index)}${match[match.length - 1]}${ruleMatch.slice(index + length)}`;
        // Removes matched text from main text layer.
        text = `${text.slice(0, index)}${spaces}${text.slice(index + length)}`;
        // Finds next match
        match = regex.exec(value);
        // Validates match is not repeated for non g regexes
        if (match && match.index === index) {
          match = null;
        }
      }
      // Pushes rule layer value
      ruleVals.push(ruleMatch);
    });

    return (
      <div className="code-input-root">
        <textarea
          value={text}
          readOnly
          tabIndex={-1}
          ref={(node) => { this.textRef = node; }}
          style={{ height: LINE_HEIGHT_PX * (numLines + 2), color: 'black', ...style }}
        />
        {ruleVals.map((ruleText, i) => (
          <textarea
            key={rules[i].regex.toString()}
            className={`field-textarea ${rules[i].className || ''}`}
            value={ruleText}
            readOnly
            tabIndex={-1}
            ref={(node) => { this.ruleTextRefs[i] = node; }}
            style={{
              height: LINE_HEIGHT_PX * (numLines + 2),
              color: rules[i].color || NODE_COLORS[i],
              ...style,
            }}
          />
        ))}
        <textarea
          className={`field-textarea ${className}`}
          value={value}
          onKeyDown={this.handleTab}
          {...other}
          placeholder="Query Payload"
          onScroll={this.handleScroll}
          ref={(node) => { this.typeTextRef = node; }}
          id="typeTextArea"
          style={{ height: LINE_HEIGHT_PX * (numLines + 2), WebkitTextFillColor: 'transparent', ...style }}
        />
      </div>
    );
  }
}

export default CodeInput;
