import { act, renderHook } from '@testing-library/react';
import { produce } from 'immer';
import React from 'react';
import {
  describe, expect, test, vi,
} from 'vitest';

import { FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';

import {
  FormContext, FormContextState, reducer, useEmbeddedForm,
} from '../useSchemaForm';

const PROP = 'break2Start';
const parentModel = schema.get('PositionalVariant');

const makeParent = (overrides: Record<string, unknown> = {}) => ({
  content: {},
  validation: { valid: true, properties: {} },
  model: parentModel,
  variant: FORM_VARIANT.EDIT,
  isDirty: false,
  disabled: false,
  update: vi.fn(),
  updateField: vi.fn(),
  updateFieldEvent: vi.fn(),
  setDirty: vi.fn(),
  ...overrides,
}) as unknown as FormContextState;

const renderEmbedded = (
  parent: FormContextState,
  defaultLinkedClass: string | null = 'GenomicPosition',
  args: { disabled?: boolean; readOnly?: boolean } = {},
) => renderHook(
  () => useEmbeddedForm(PROP, defaultLinkedClass ?? undefined, args),
  { wrapper: ({ children }) => <FormContext.Provider value={parent}>{children}</FormContext.Provider> },
);

describe('useEmbeddedForm', () => {
  describe('content', () => {
    test('is the embedded record from the parent form', () => {
      const embedded = { '@class': 'GenomicPosition', pos: 3 };
      const { result } = renderEmbedded(makeParent({ content: { [PROP]: embedded } }));

      expect(result.current.content).toBe(embedded);
    });

    test('is an empty record when the parent has no value', () => {
      const { result } = renderEmbedded(makeParent());

      expect(result.current.content).toEqual({});
    });
  });

  describe('validation', () => {
    test('is the parent validation of the embedded property', () => {
      const propValidation = { valid: false, message: 'bad', properties: { pos: { valid: false, message: 'Required Value' } } };
      const { result } = renderEmbedded(makeParent({ validation: { valid: false, properties: { [PROP]: propValidation } } }));

      expect(result.current.validation).toBe(propValidation);
    });

    test('defaults to valid when the parent has no result for the property', () => {
      const { result } = renderEmbedded(makeParent());

      expect(result.current.validation).toEqual({ valid: true });
    });
  });

  describe('model', () => {
    test('uses the class of the existing embedded record', () => {
      const { result } = renderEmbedded(makeParent({ content: { [PROP]: { '@class': 'CytobandPosition' } } }), 'GenomicPosition');

      expect(result.current.model.name).toBe('CytobandPosition');
    });

    test('falls back to the default linked class when the record has no class', () => {
      const { result } = renderEmbedded(makeParent({ content: { [PROP]: { pos: 1 } } }), 'GenomicPosition');

      expect(result.current.model.name).toBe('GenomicPosition');
    });

    test('falls back to the linked class of the property without a default', () => {
      const { result } = renderEmbedded(makeParent(), null);

      expect(result.current.model.name).toBe(parentModel.properties[PROP].linkedClass);
    });
  });

  describe('form state', () => {
    test('passes through dirty state and setDirty from the parent', () => {
      const parent = makeParent({ isDirty: true });
      const { result } = renderEmbedded(parent);

      expect(result.current.isDirty).toBe(true);
      expect(result.current.setDirty).toBe(parent.setDirty);
    });

    test('uses the parent variant', () => {
      const { result } = renderEmbedded(makeParent({ variant: FORM_VARIANT.NEW }));

      expect(result.current.variant).toBe(FORM_VARIANT.NEW);
    });

    test('is a view form when read only', () => {
      const { result } = renderEmbedded(makeParent({ variant: FORM_VARIANT.EDIT }), 'GenomicPosition', { readOnly: true });

      expect(result.current.variant).toBe(FORM_VARIANT.VIEW);
    });

    test.each([
      [false, false, false],
      [true, false, true],
      [false, true, true],
      [true, true, true],
    ])('disabled when args.disabled=%s and parent disabled=%s is %s', (argDisabled, parentDisabled, expected) => {
      const { result } = renderEmbedded(makeParent({ disabled: parentDisabled }), 'GenomicPosition', { disabled: argDisabled });

      expect(Boolean(result.current.disabled)).toBe(expected);
    });
  });

  describe('updates', () => {
    test('update prefixes keys with the property name and sets the rendered class', () => {
      const parent = makeParent();
      const { result } = renderEmbedded(parent);

      act(() => result.current.update({ pos: 5, other: 'x' }));

      expect(parent.update).toHaveBeenCalledWith({
        [`${PROP}.@class`]: 'GenomicPosition',
        [`${PROP}.pos`]: 5,
        [`${PROP}.other`]: 'x',
      });
    });

    test('update uses the class of the existing record', () => {
      const parent = makeParent({ content: { [PROP]: { '@class': 'CytobandPosition' } } });
      const { result } = renderEmbedded(parent);

      act(() => result.current.update({ arm: 'p' }));

      expect(parent.update).toHaveBeenCalledWith({
        [`${PROP}.@class`]: 'CytobandPosition',
        [`${PROP}.arm`]: 'p',
      });
    });

    test('an explicit class in the update wins over the rendered class', () => {
      const parent = makeParent();
      const { result } = renderEmbedded(parent);

      act(() => result.current.update({ '@class': 'CytobandPosition' }));

      expect(parent.update).toHaveBeenCalledWith({ [`${PROP}.@class`]: 'CytobandPosition' });
    });

    test('updateField updates a single property', () => {
      const parent = makeParent();
      const { result } = renderEmbedded(parent);

      act(() => result.current.updateField('pos', 7));

      expect(parent.update).toHaveBeenCalledWith({ [`${PROP}.@class`]: 'GenomicPosition', [`${PROP}.pos`]: 7 });
    });

    test('updateFieldEvent reads the name and value from the event target', () => {
      const parent = makeParent();
      const { result } = renderEmbedded(parent);

      act(() => result.current.updateFieldEvent({ target: { name: 'pos', value: 9 } }));

      expect(parent.update).toHaveBeenCalledWith({ [`${PROP}.@class`]: 'GenomicPosition', [`${PROP}.pos`]: 9 });
    });
  });

  describe('with the form reducer', () => {
    const model = {
      name: 'Mock',
      properties: {
        start: {
          name: 'start', type: 'embedded' as const, linkedClass: 'Position', nullable: true,
        },
      },
    };
    const run = produce(reducer) as unknown as (state: unknown, action: unknown) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const applyEmbeddedUpdate = (content: Record<string, unknown>, defaultLinkedClass: string | undefined, updates: Record<string, unknown>) => {
      const parent = makeParent({ content, model });
      const { result } = renderHook(
        () => useEmbeddedForm('start', defaultLinkedClass, {}),
        { wrapper: ({ children }) => <FormContext.Provider value={parent}>{children}</FormContext.Provider> },
      );
      act(() => result.current.update(updates));
      const [appliedUpdates] = (parent.update as ReturnType<typeof vi.fn>).mock.calls[0];

      return run(
        {
          model, content, variant: FORM_VARIANT.EDIT, isDirty: false, validation: { valid: true, properties: {} },
        },
        { type: 'UPDATE_FORM', payload: { updates: appliedUpdates } },
      );
    };

    test('keeps pos when the record is created with a concrete default class', () => {
      const state = applyEmbeddedUpdate({}, 'GenomicPosition', { pos: 5 });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 5 });
    });

    test('keeps pos when the existing record already has a concrete class', () => {
      const state = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition' } }, undefined, { pos: 5 });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 5 });
    });

    test('keeps pos when only the abstract linked class is known', () => {
      const state = applyEmbeddedUpdate({}, undefined, { pos: 5 });

      expect(state.content.start).toEqual({ '@class': 'Position', pos: 5 });
    });

    test('switching class removes the properties of the previous class', () => {
      const state = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition', pos: 5 } }, undefined, { '@class': 'CytobandPosition' });

      expect(state.content.start).toEqual({ '@class': 'CytobandPosition' });
    });

    test('updates several properties of the embedded record at once', () => {
      const state = applyEmbeddedUpdate({ start: { '@class': 'CytobandPosition' } }, undefined, { arm: 'p', majorBand: 1, minorBand: 2 });

      expect(state.content.start).toEqual({
        '@class': 'CytobandPosition', arm: 'p', majorBand: 1, minorBand: 2,
      });
    });

    test('removes properties that do not belong to the concrete class', () => {
      const state = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition' } }, undefined, { pos: 5, bogus: true });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 5 });
    });

    test('leaves other properties of the parent form untouched', () => {
      const state = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition' }, other: 'x' }, undefined, { pos: 5 });

      expect(state.content.other).toBe('x');
    });

    test('marks the parent form dirty', () => {
      const state = applyEmbeddedUpdate({}, 'GenomicPosition', { pos: 5 });

      expect(state.isDirty).toBe(true);
    });

    test('validation reports a missing required property until it is provided', () => {
      const missing = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition' } }, undefined, { '@class': 'GenomicPosition' });

      expect(missing.validation.properties.start.valid).toBe(false);
      expect(missing.validation.properties.start.properties.pos).toMatchObject({ valid: false, message: 'Required Value' });

      const provided = applyEmbeddedUpdate({ start: { '@class': 'GenomicPosition' } }, undefined, { pos: 5 });

      expect(provided.validation.properties.start.valid).toBe(true);
    });
  });
});
