import './index.scss';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper, Typography,
} from '@mui/material';
import React, { useContext, useMemo } from 'react';

import ActionButton from '@/components/ActionButton';
import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext, useFormContext } from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { EdgeType, GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import { ErrorMessage } from '@/services/errors';
import schemaDefn from '@/services/schema';

import { useAuth } from '../Auth';
import EdgeSentence from '../SentencePreview/EdgeSentence';
import EdgeTable from './EdgeTable';
import RelatedStatementsTable from './RelatedStatementsTable';
import RelatedVariantsTable from './RelatedVariantsTable';

interface FormLayoutContextValue {
  type: 'dialog' | 'inline';
  onClose?: () => void;
}
const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  type: 'inline',
});

function FormActions() {
  const form = useFormContext();
  const { type: formType, onClose } = useContext(FormLayoutContext);

  const content = (
    <>
      {(form.variant === FORM_VARIANT.EDIT && !form.content.deletedAt)
        && (
          <ActionButton
            className="record-form__delete-button"
            color="error"
            disabled={form.action.inProgress}
            message="Are you sure you want to delete this record?"
            onClick={form.action.delete}
            size="medium"
            variant="outlined"
          >
            DELETE RECORD
          </ActionButton>
        )}
      {formType === 'dialog' && onClose && (
        <Button
          onClick={onClose}
          size="medium"
          variant="outlined"
        >
          {form.variant === FORM_VARIANT.VIEW ? 'Close' : 'Cancel'}
        </Button>
      )}
      {(form.variant === FORM_VARIANT.NEW || (form.variant === FORM_VARIANT.EDIT && !form.model.isEdge && !form.content.deletedAt))
        && (
          <Button
            color="primary"
            disabled={form.action.inProgress || (!form.validation.valid && form.isDirty)}
            onClick={form.action.submit}
            size="medium"
            variant="contained"
          >
            {form.variant === FORM_VARIANT.EDIT && !form.content.deletedAt
              ? 'SUBMIT CHANGES'
              : 'SUBMIT'}
          </Button>
        )}
    </>
  );

  if (formType === 'dialog') {
    return (
      <DialogActions>
        {content}
      </DialogActions>
    );
  }
  return (
    <div className="record-form__action-buttons">
      {content}
    </div>
  );
}

interface FormHeaderProps {
  title: string;
  actions?: React.ReactNode;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
}

function FormHeader({
  title, onToggleState, actions,
}: FormHeaderProps) {
  const auth = useAuth();
  const form = useFormContext();
  const { type: formType } = useContext(FormLayoutContext);
  let pageTitle = title;
  const subtitle = title;

  if (form.variant === FORM_VARIANT.VIEW && form.content) {
    if (form.content.displayName) {
      pageTitle = `${form.content.displayName} (${form.content['@rid']})`;
    } else {
      pageTitle = `${form.content['@class']} ${form.content['@rid']}`;
    }
  }

  const content = (
    <div className="record-form__header">
      <span className="title">
        <Typography variant={formType === 'dialog' ? 'h2' : 'h1'}>{pageTitle}</Typography>
        {subtitle !== pageTitle && (<Typography variant="subtitle1">{subtitle}</Typography>)}
      </span>
      <div className={`header__actions header__actions--${form.variant}`}>
        {actions}
        {onToggleState && (form.variant === FORM_VARIANT.VIEW || form.variant === FORM_VARIANT.EDIT) && (
          <RecordFormStateToggle
            allowEdit={auth.hasWriteAccess && !form.content.deletedAt}
            message="Are you sure? You will lose your changes."
            onClick={onToggleState}
            requireConfirm={form.variant === FORM_VARIANT.EDIT && form.isDirty}
            value={form.variant}
          />
        )}
      </div>
    </div>
  );

  if (formType === 'dialog') {
    return (
      <DialogTitle component="div">
        {content}
      </DialogTitle>
    );
  }
  return content;
}

function FormErrors() {
  const form = useFormContext();
  return (
    <>
      <ErrorMessage error={form.action.error}>{form.action.errorMessage}</ErrorMessage>
      {form.validation.message && (
        <Alert severity="error">{form.validation.message}</Alert>
      )}
    </>
  );
}

function FormContent({ children }: { children: React.ReactNode }) {
  const { type: formType } = useContext(FormLayoutContext);

  if (formType === 'dialog') {
    return (
      <DialogContent>
        {children}
      </DialogContent>
    );
  }
  return children;
}

interface FormProps {
  value: ReturnType<typeof useSchemaForm>;
  children: React.ReactNode;
  formType: 'inline' | 'dialog' | undefined;
  open: boolean | undefined;
  onClose: (() => void) | undefined;
}

function Form(props: FormProps) {
  const {
    value, children, formType, open = false, onClose,
  } = props;
  const formTypeValue = useMemo(() => ({ type: formType ?? 'inline', onClose }), [formType, onClose]);
  const content = (
    <FormLayoutContext.Provider value={formTypeValue}>
      <FormContext.Provider value={value}>
        {children}
      </FormContext.Provider>
    </FormLayoutContext.Provider>
  );

  if (formType === 'dialog') {
    return (
      <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open}>
        {content}
      </Dialog>
    );
  }
  return <Paper className={`record-form record-form--${formType}`} elevation={4}>{content}</Paper>;
}

export interface RecordFormProps {
  /** the title for this form */
  title: string;
  /** name of class model to be displayed */
  modelName?: string;
  onSubmit?: (record?: GeneralRecordType) => void;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
  /** values of individual properties of passed class model */
  value?: GeneralRecordType;
  /** the type of NodeForm to create */
  variant?: FORM_VARIANT.EDIT | FORM_VARIANT.NEW | FORM_VARIANT.VIEW;
  formType?: 'inline' | 'dialog';
  open?: boolean;
  onClose?: () => void;
}

/**
 * Form/View that displays the contents of a single node
 */
const RecordForm = ({
  value: initialValue,
  modelName = '',
  title,
  onToggleState,
  onSubmit,
  variant = FORM_VARIANT.VIEW,
  open = false,
  onClose,
  formType = 'inline',
}: RecordFormProps) => {
  const model = schemaDefn.get(modelName);

  const form = useSchemaForm(model, initialValue, { variant, onActionSuccess: onSubmit });

  return (
    <Form formType={formType} onClose={onClose} open={open} value={form}>
      <FormHeader onToggleState={onToggleState} title={title} />
      <FormContent>
        {form.model.isEdge && (
          <EdgeSentence
            srcRecord={(form.content as EdgeType).out}
            tgtRecord={(form.content as EdgeType).in}
            type={model.name}
          />
        )}
        <FormLayout
          collapseExtra
        />
        {modelName && variant === FORM_VARIANT.VIEW && schemaDefn.ancestors(modelName).includes('V') && (
          <>
            <EdgeTable recordId={String(form.content['@rid'])} />
            <RelatedStatementsTable recordId={String(form.content['@rid'])} />
            {schemaDefn.ancestors(modelName).includes('Ontology') && (
            <RelatedVariantsTable recordId={String(form.content['@rid'])} />
            )}
          </>
        )}
        <FormErrors />
      </FormContent>
      <FormActions />
    </Form>
  );
};

export {
  Form,
  FormActions, FormContent, FormErrors, FormHeader,
};
export default RecordForm;
