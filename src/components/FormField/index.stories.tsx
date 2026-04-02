import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import { HttpResponse } from 'msw';
import React, { ReactNode, useMemo } from 'react';
import { expect, fn, within } from 'storybook/test';

import preview, { mockQueryHandler } from '#.storybook/preview';

import FormContext, { FormContextState } from '../FormContext';
import { FORM_VARIANT } from '../util';
import Component from '.';

type FormContextArgs = {
  value?: any;
  errorMessage?: string | null | undefined;
  updateFieldEvent?: FormContextState['updateFieldEvent'];
};

type CustomArgs = React.ComponentProps<typeof Component> & FormContextArgs;

function MockProvider({
  children, value, name, errorMessage, updateFieldEvent,
}: { children: ReactNode; name: string } & FormContextArgs) {
  const state = useMemo(() => ({
    updateFieldEvent: updateFieldEvent ?? fn(),
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
  }), [updateFieldEvent, value, errorMessage, name]);

  return <FormContext.Provider value={state}>{children}</FormContext.Provider>;
}

const meta = preview.type<{ args: CustomArgs }>().meta({
  component: Component,
  args: {
    updateFieldEvent: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        mockQueryHandler(() => HttpResponse.json(
          [
            { '@rid': '#15:1' },
            { '@rid': '#15:2' },
            { '@rid': '#15:3' },
          ].map((record) => ({ ...record, displayName: `thing (${record['@rid']})` })),
        )),
      ],
    },
  },
  render: (args) => {
    const {
      value, errorMessage, updateFieldEvent, model, ...rest
    } = args;
    return (
      <MockProvider
        errorMessage={errorMessage}
        name={model.name ?? ''}
        updateFieldEvent={updateFieldEvent}
        value={value}
      ><Component {...rest} model={model} />
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

export const TimestampEmpty = meta.story({
  args: {
    model: { name: 'createdAt', type: 'long', format: 'date' },
  },
});

export const Timestamp = TimestampEmpty.extend({
  args: {
    value: new Date(2020, 0, 1).getTime(),
  },
});

export const TimestampDisabled = Timestamp.extend({
  args: {
    disabled: true,
  },
});

export const TimestampWithError = Timestamp.extend({
  args: { errorMessage: 'bad value' },
});

export const BooleanEmpty = meta.story({
  args: {
    model: {
      name: 'germline',
      type: 'boolean',
    },
  },
});

export const BooleanFalse = BooleanEmpty.extend({
  args: { value: false },
});

export const BooleanTrue = BooleanEmpty.extend({
  args: { value: true },
});

export const BooleanDisabled = BooleanFalse.extend({
  args: { disabled: true },
});

export const BooleanWithError = BooleanFalse.extend({
  args: { errorMessage: 'bad value' },
});

export const EnumEmpty = meta.story({
  args: {
    model: {
      name: 'zygosity',
      choices: ['heterozygous', 'homozygous'],
    },
  },
});

export const Enum = EnumEmpty.extend({
  args: {
    value: 'heterozygous',
  },
});

export const EnumDisabled = Enum.extend({
  args: {
    disabled: true,
  },
});

export const EnumWithError = Enum.extend({
  args: { errorMessage: 'bad value' },
});

export const EmbeddedSetEmpty = meta.story({
  args: {
    model: {
      type: 'embeddedset', linkedType: 'string', name: 'subsets', iterable: true,
    },
  },
});

export const EmbeddedSet = EmbeddedSetEmpty.extend({
  args: {
    value: ['thing 1', 'thing 2'],
  },
});

export const EmbeddedSetWithHelperTextAndLabel = EmbeddedSet.extend({
  args: {
    helperText: 'this field is useful',
    label: 'List of subsets',
  },
});

export const EmbeddedSetError = EmbeddedSet.extend({
  args: { errorMessage: 'bad value' },
});

export const EmbeddedSetItemDeleted = EmbeddedSet.extend({
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole('button', { name: 'thing 2' });
    await userEvent.click(within(chip).getByLabelText('delete value'));
    await expect(within(chip).queryByLabelText('delete value')).toBeFalsy();
    await expect(within(chip).getByLabelText('restore value')).toBeTruthy();
  },
});

export const LinkEmpty = meta.story({
  args: {
    model: {
      type: 'link',
      linkedClass: 'Source',
      name: 'source',
      description: 'If the statement is imported from an external source, it is linked here',
    },
  },
});

export const Link = LinkEmpty.extend({
  args: {
    value: { '@rid': '#15:1' },
  },
});

export const LinkDisabled = Link.extend({
  args: { disabled: true },
});

export const LinkWithError = Link.extend({
  args: { errorMessage: 'bad value' },
});

export const LinkSetEmpty = meta.story({
  args: {
    model: {
      ...Link.composed.args.model,
      type: 'linkset',
    },
  },
});

export const LinkSet = LinkSetEmpty.extend({
  args: {
    value: [{ '@rid': '#15:1' }, { '@rid': '#15:2' }],
  },
});

export const LinkSetDisabled = LinkSet.extend({
  args: { disabled: true },
});

export const LinkSetWithError = LinkSet.extend({
  args: { errorMessage: 'bad value' },
});

export const LinkAbstractClassEmpty = meta.story({
  args: {
    model: { ...Link.composed.args.model, name: 'evidence', linkedClass: 'Evidence' },
  },
});

export const LinkAbstractClass = LinkAbstractClassEmpty.extend({
  args: {
    value: { '@rid': '#15:1' },
  },
});

export const LinkAbstractClassDisabled = LinkAbstractClass.extend({
  args: { disabled: true },
});

export const LinkAbstractClassWithError = LinkAbstractClass.extend({
  args: { errorMessage: 'bad value' },
});

export const LinkSetAbstractClassEmpty = meta.story({
  args: {
    model: {
      ...LinkAbstractClass.composed.args.model,
      type: 'linkset',
      minItems: 1,
    },
  },
});

export const LinkSetAbstractClass = LinkSetAbstractClassEmpty.extend({
  args: {
    value: [{ '@rid': '#15:1' }, { '@rid': '#15:2' }],
  },
});

export const LinkSetAbstractClassDisabled = LinkSetAbstractClass.extend({
  args: { disabled: true },
});

export const LinkSetAbstractClassWithError = LinkSetAbstractClass.extend({
  args: { errorMessage: 'bad value' },
});

export const PermissionsFieldEmpty = meta.story({
  args: {
    model: schemaDefn.getProperty('UserGroup', 'permissions'),
  },
});

export const StatementReviewEmpty = meta.story({
  args: {
    model: schemaDefn.getProperty('Statement', 'reviews'),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reviews')).toBeTruthy();
    await expect(canvas.getAllByRole('row')).toHaveLength(1);
  },
});

export const StatementReview = StatementReviewEmpty.extend({
  args: {
    value: [
      {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'first',
      },
      {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'second',
      }, {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'third',
      },
    ],
  },
  parameters: {
    msw: {
      handlers: [mockQueryHandler(() => HttpResponse.json([
        { '@class': 'User', '@rid': '#19:0', name: 'bob' },
      ]))],
    },
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('Reviews')).toBeTruthy();
    const values = args.value.length;
    await expect(canvas.getAllByRole('row')).toHaveLength(values + 1);
    await expect(canvas.findAllByText('bob (#19:0)')).resolves.toHaveLength(values);
  },
});

export const LinkPositionClassEmpty = meta.story({
  args: {
    model: { type: 'embedded', linkedClass: 'Position', name: 'break1Start' },
  },
});

export const LinkPositionClass = LinkPositionClassEmpty.extend({
  args: {
    value: { '@class': 'GenomicPosition' },
  },
});

export const LinkPositionClassProtein = LinkPositionClass.extend({
  args: {
    value: { '@class': 'ProteinPosition' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/refAA/)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/arm/i)).not.toBeInTheDocument();
  },
});

export const LinkPositionClassCytoband = LinkPositionClass.extend({
  args: {
    value: { '@class': 'CytobandPosition' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/arm/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/majorBand/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/minorBand/i)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/position/i)).not.toBeInTheDocument();
  },
});

export const LinkPositionClassCytobandFilled = LinkPositionClass.extend({
  args: {
    value: { '@class': 'CytobandPosition' },
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(await canvas.findByLabelText(/arm/i), 'p');
    await userEvent.type(await canvas.findByLabelText(/majorBand/i), '1');
    await userEvent.type(await canvas.findByLabelText(/minorBand/i), '2');

    expect(args.updateFieldEvent).toHaveBeenLastCalledWith({
      target: {
        name: 'break1Start',
        value: {
          '@class': 'CytobandPosition', arm: 'p', majorBand: '1', minorBand: '2',
        },
      },
    });
  },
});

export const LinkGenomicPositionClassEmpty = LinkPositionClassEmpty.extend({
  args: {
    baseModel: 'GenomicPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/i)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/offset/i)).not.toBeInTheDocument();
  },
});

export const LinkCdsPositionClassEmpty = LinkPositionClassEmpty.extend({
  args: {
    baseModel: 'CdsPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/offset/i)).toBeInTheDocument();
  },
});
