import React, { ReactNode, useMemo } from 'react';
import { fn } from 'storybook/test';

import preview from '#.storybook/preview';

import FormContext from '../FormContext';
import { FORM_VARIANT } from '../util';
import Component from '.';

type FormContextArgs = {
  value?: any;
  errorMessage?: string | null | undefined;
};

type CustomArgs = React.ComponentProps<typeof Component> & FormContextArgs;

function MockProvider({
  children, value, name, errorMessage,
}: { children: ReactNode; name: string } & FormContextArgs) {
  const state = useMemo(() => ({
    updateFieldEvent: fn(),
    updateField: fn(),
    update: fn(),
    replaceContent: fn(),
    setFormIsDirty: fn(),
    formIsDirty: value !== undefined,
    additionalValidationError: '',
    formHasErrors: Boolean(errorMessage),
    formErrors: { [name]: errorMessage ? { message: errorMessage } : undefined },
    formContent: {
      [name]: value,
    },
    formVariant: FORM_VARIANT.NEW,
  }), [value, errorMessage, name]);

  return <FormContext.Provider value={state}>{children}</FormContext.Provider>;
}

const meta = preview.type<{ args: CustomArgs }>().meta({
  component: Component,
  title: 'components/FormField/FreeText',
  render: (args) => {
    const {
      value, errorMessage, model, ...rest
    } = args;
    return (
      <MockProvider
        errorMessage={errorMessage}
        name={model.name ?? ''}
        value={value}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...rest} model={model} />
      </MockProvider>
    );
  },
});

export const FreeTextEmpty = meta.story({
  args: {
    model: { name: 'comment', type: 'string' },
  },
});

export const FreeText = FreeTextEmpty.extend({
  args: {
    value: 'hello world',
    model: { name: 'comment', type: 'string' },
  },
});

export const FreeTextWithHelperTextAndLabel = FreeText.extend({
  args: {
    helperText: 'this field is useful',
    label: 'User Comments',
  },
});

export const FreeTextDisabled = FreeText.extend({
  args: {
    disabled: true,
  },
});

export const FreeTextWithError = FreeText.extend({
  args: { errorMessage: 'bad value' },
});
