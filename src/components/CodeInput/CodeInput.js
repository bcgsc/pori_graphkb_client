import React, { Component } from 'react';
import './CodeInput.css';
import PropTypes from 'prop-types';
import config from '../../static/config';

const LINE_HEIGHT_PX = 20;
const COMMENT_REGEX = /\/\/.*(?!\\n)/g;

const { NODE_COLORS } = config;


/**
 * Component for multicolored inputs. Defaults to recognizing "// ... " comment
 * string format, but can have additional regexes added to recognize and color
 * other patterns. Requires MONOSPACE FONT in order to properly align different
 * colored layers properly.
 */
class CodeInput extends Component {
  constructor(props) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
    this.ruleTextRefs = [];
  }

  /**
   * Synchronizes scrolling between all rule layers.
   */
  handleScroll() {
    this.ruleTextRefs.forEach((r) => {
      r.scrollTop = this.typeTextRef.scrollTop;
      r.scrollLeft = this.typeTextRef.scrollLeft;
    });
    this.textRef.scrollTop = this.typeTextRef.scrollTop;
    this.textRef.scrollLeft = this.typeTextRef.scrollLeft;
  }

  render() {
    const {
      value,
      style,
      className,
      ruleColors,
      ruleClassNames,
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
      let ruleMatch = value.replace(/.(?!\\n)/g, ' ');

      // Cycle through all instances of pattern
      let match = regex.exec(value);
      while (match) {
        // Calculates additional offset within the total match and the intended
        // capture group.
        const offset = new RegExp(match[match.length - 1]).exec(match[0]).index;
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
            key={ruleText}
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
          {...other}
          placeholder="Query Payload"
          onScroll={this.handleScroll}
          ref={(node) => { this.typeTextRef = node; }}
          style={{ height: LINE_HEIGHT_PX * (numLines + 2), WebkitTextFillColor: 'transparent', ...style }}
        />
      </div>
    );
  }
}

/**
 * @namespace
 * @property {string} value - textarea value
 * @property {Object} style - style prop to be applied to the base textarea
 * component.
 * @property {string} className - Class name prop applied to base textarea
 * component.
 * @property {Array.<Object>} rules - List of formatting rules for the
 * component.
 * @property {string} rules.regex - Matching regex that is applied to the text.
 * IMPORTANT: will only match the LAST capture group defined in the regex.
 * Using 'g' flag is recommended.
 * @property {string} rules.color - Color to color matches with.
 * @property {string} rules.className - Class name prop applied to matched
 * textarea.
 */
CodeInput.propTypes = {
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
};

CodeInput.defaultProps = {
  value: '',
  style: {},
  className: '',
  rules: [{ regex: COMMENT_REGEX, color: 'green', className: '' }],
};

export default CodeInput;
