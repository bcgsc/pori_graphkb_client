import React, { ReactNode, useMemo } from 'react';
import { fn } from 'storybook/test';

import { SchemaPropertyDefinition } from '@/services/schema';
import preview from '#.storybook/preview';

import { FormContext } from '../hooks/useSchemaForm';
import { FORM_VARIANT } from '../util';
import Component from '.';

type FormContextArgs = {
  value?: any;
  errorMessage?: string | null | undefined;
  formVariant?: FORM_VARIANT;
  model?: Partial<SchemaPropertyDefinition>
};

type CustomArgs = React.ComponentProps<typeof Component> & FormContextArgs;

function MockProvider({
  children, value, name, errorMessage, formVariant, model,
}: { children: ReactNode; name: string } & FormContextArgs) {
  const state = useMemo(() => ({
    update: fn(),
    updateFieldEvent: fn(),
    updateField: fn(),
    setDirty: fn(),
    isDirty: value !== undefined,
    validation: {
      valid: !errorMessage,
      properties: { [name]: { message: errorMessage ?? undefined, valid: !errorMessage } },
    },
    content: {
      [name]: value,
    },
    variant: formVariant ?? FORM_VARIANT.NEW,
    model: {
      name: 'Mock',
      properties: {
        [name]: { name, type: 'string' as const, ...model },
      },
    },
    disabled: false,
  }), [value, errorMessage, name, formVariant, model]);

  return <FormContext.Provider value={state}>{children}</FormContext.Provider>;
}

const meta = preview.type<{ args: CustomArgs }>().meta({
  component: Component,
  title: 'components/FormField/FreeText',
  render: (args) => {
    const {
      value, errorMessage, name, formVariant, ...rest
    } = args;
    return (
      <MockProvider
        errorMessage={errorMessage}
        formVariant={formVariant}
        name={name ?? ''}
        value={value}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...rest} name={name} />
      </MockProvider>
    );
  },
});

export const FreeTextEmpty = meta.story({
  args: {
    name: 'comment',
  },
});

export const FreeText = FreeTextEmpty.extend({
  args: {
    value: 'hello world',
    name: 'comment',
  },
});

export const FreeTextWithLabel = FreeText.extend({
  args: {
    label: 'User Comments',
  },
});

export const FreeTexReadOnly = FreeText.extend({
  args: {
    formVariant: FORM_VARIANT.VIEW,
  },
});

export const FreeTextWithError = FreeText.extend({
  args: { errorMessage: 'bad value' },
});
