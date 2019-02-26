import React from 'react';
import PropTypes from 'prop-types';


import NodeForm from '../../components/RecordForm';
import { KBContext } from '../../components/KBContext';
import { FORM_VARIANT } from '../../components/RecordForm/util';


const DEFAULT_TITLES = {
  [FORM_VARIANT.EDIT]: 'Edit this Node',
  [FORM_VARIANT.NEW]: 'Add a new Node',
  [FORM_VARIANT.DELETE]: 'Delete this Node',
  [FORM_VARIANT.VIEW]: 'Node Contents',
};


class NodeView extends React.PureComponent {
  static contextType = KBContext;

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  render() {
    const { match: { params: { rid = null, modelName }, path }, history } = this.props;
    const { schema } = this.context;

    let variant = FORM_VARIANT.VIEW;
    for (const variantName of Object.values(FORM_VARIANT)) { // eslint-disable-line no-restricted-syntax
      if (path.includes(variantName)) {
        variant = variantName;
        break;
      }
    }
    if (modelName) {
      const model = schema.get(modelName);
      if (!model || model.isAbstract) {
        history.push(
          '/error',
          {
            error: {
              name: 'PageNotFound',
              message: 'Page Not Found',
            },
          },
        );
      }
    }
    return (
      <NodeForm
        variant={variant}
        modelName={modelName}
        rid={rid}
        title={DEFAULT_TITLES[variant]}
        onTopClick={() => {
          const newPath = path
            .replace(variant, variant === FORM_VARIANT.EDIT
              ? FORM_VARIANT.VIEW
              : FORM_VARIANT.EDIT)
            .replace(':rid', rid);
          history.push(newPath);
        }}
      />
    );
  }
}


export default NodeView;
