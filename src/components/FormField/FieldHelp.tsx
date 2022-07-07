import React from 'react';

import ClickToolTip from '@/components/ClickToolTip';

interface FieldHelpProps {
  /** an example value */
  example?: unknown;
  /** the description of the form field */
  description?: string;
}

/**
 * Clickable Question mark Icon that displays some description
 * which helps explain to the user what the
 * form field they are looking at should be filled
 * with
 */
const FieldHelp = ({ example, description }: FieldHelpProps) => {
  let text;

  if (description) {
    text = description;

    if (example) {
      text = `${text} (Example: ${example})`;
    }
  }
  return (
    <ClickToolTip
      title={text}
    />
  );
};

FieldHelp.defaultProps = {
  description: '',
  example: '',
};

export default FieldHelp;
