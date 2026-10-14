import React, { ReactNode, useMemo } from 'react';
import { expect, fn } from 'storybook/test';

import FormContext from '@/components/FormContext';
import { FORM_VARIANT } from '@/components/util';
import schema, { SchemaPropertyDefinition } from '@/services/schema';
import preview from '#.storybook/preview';

import Component from './EmbeddedForm';

type FormContextArgs = {
  value?: any;
  errorMessage?: string | null | undefined;
  formVariant?: FORM_VARIANT;
  model?: Partial<SchemaPropertyDefinition>
};

type CustomArgs = React.ComponentProps<typeof Component> & FormContextArgs;

const break1StartModel = schema.get('PositionalVariant').properties.break1Start;

function MockProvider({
  children, value, name, errorMessage, formVariant, model,
}: { children: ReactNode; name: string } & FormContextArgs) {
  const state = useMemo(() => ({
    update: fn(),
    updateFieldEvent: fn(),
    updateField: fn(),
    setFormIsDirty: fn(),
    formIsDirty: value !== undefined,
    additionalValidationError: '',
    formHasErrors: Boolean(errorMessage),
    formErrors: { [name]: errorMessage ? { message: errorMessage } : undefined },
    formContent: {
      [name]: value,
    },
    formVariant: formVariant ?? FORM_VARIANT.NEW,
    model: {
      properties: {
        [name]: { name, type: 'string' as const, ...model },
      },
    },
  }), [value, errorMessage, name, formVariant, model]);

  return <FormContext.Provider value={state}>{children}</FormContext.Provider>;
}

const meta = preview.type<{ args: CustomArgs }>().meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'break1Start',
    defaultLinkedClass: 'GenomicPosition',
    model: break1StartModel,
  },
  render: (args) => {
    const {
      value, errorMessage, name, formVariant, model, ...rest
    } = args;
    return (
      <MockProvider
        errorMessage={errorMessage}
        formVariant={formVariant}
        model={model}
        name={name ?? ''}
        value={value}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...rest} name={name} />
      </MockProvider>
    );
  },
});

export const NoVariantEmpty = meta.story();

export const GenomicPositionVariant = meta.story({
  args: {
    value: { '@class': 'GenomicPosition' },
  },
});

export const GenomicPositionVariantWithValue = GenomicPositionVariant.extend({
  args: {
    value: { '@class': 'GenomicPosition', pos: 400 },
  },
});

export const GenomicPositionVariantDisabled = GenomicPositionVariantWithValue.extend({
  args: { disabled: true },
});

export const GenomicPositionVariantReadOnly = GenomicPositionVariantWithValue.extend({
  args: { formVariant: FORM_VARIANT.VIEW, readOnly: true },
});

export const ProteinPositionVariant = meta.story({
  args: {
    value: { '@class': 'ProteinPosition' },
    variant: 'ProteinPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/^pos/)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/refAA/)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/arm/i)).not.toBeInTheDocument();
  },
});

export const ProteinPositionVariantWithValue = ProteinPositionVariant.extend({
  args: {
    value: { '@class': 'ProteinPosition', refAA: 'D', pos: 255 },
  },
});

export const ProteinPositionVariantDisabled = ProteinPositionVariantWithValue.extend({
  args: { disabled: true },
});

export const ProteinPositionVariantReadOnly = ProteinPositionVariantWithValue.extend({
  args: { formVariant: FORM_VARIANT.VIEW, readOnly: true },
});

export const CytobandPositionVariant = meta.story({
  args: {
    value: { '@class': 'CytobandPosition' },
    variant: 'CytobandPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/arm/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/majorBand/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/minorBand/i)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/^pos/i)).not.toBeInTheDocument();
  },
});

export const CytobandPositionVariantWithValue = CytobandPositionVariant.extend({
  args: {
    value: {
      '@class': 'CytobandPosition', arm: 'p', majorBand: '1', minorBand: '2',
    },
  },
});

export const CytobandPositionVariantDisabled = CytobandPositionVariantWithValue.extend({
  args: { disabled: true },
});

export const CytobandPositionVariantReadOnly = CytobandPositionVariantWithValue.extend({
  args: { formVariant: FORM_VARIANT.VIEW, readOnly: true },
});

export const CdsPositionVariant = meta.story({
  args: {
    value: { '@class': 'CdsPosition' },
    variant: 'CdsPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/^pos/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/offset/i)).toBeInTheDocument();
  },
});

export const CdsPositionVariantWithValue = CdsPositionVariant.extend({
  args: {
    value: {
      '@class': 'CdsPosition', pos: 49, offset: 0,
    },
  },
});

export const CdsPositionVariantReadOnly = CdsPositionVariantWithValue.extend({
  args: { formVariant: FORM_VARIANT.VIEW, readOnly: true },
});
