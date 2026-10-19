import { produce } from 'immer';
import {
  describe, expect, test, vi,
} from 'vitest';

import { FORM_VARIANT } from '@/components/util';

import { FormContextState, reducer } from '../useSchemaForm';

type Model = FormContextState['model'];
/* eslint-disable @typescript-eslint/no-explicit-any */
type State = {
  model: Model;
  content: Record<string, any>;
  isDirty: boolean;
  variant: FORM_VARIANT;
  validation: { valid: boolean; properties?: Record<string, any> };
};

const run = produce(reducer) as unknown as (state: unknown, action: unknown) => State;

const makeModel = (): Model => ({
  name: 'Mock',
  properties: {
    name: { name: 'name', type: 'string', default: 'abc' },
    slug: { name: 'slug', type: 'string', generateDefault: (record) => `slug-${record.name}` },
    start: { name: 'start', type: 'embedded', linkedClass: 'GenomicPosition' },
    other: { name: 'other', type: 'string' },
  },
});

const emptyState = (model: Model, variant = FORM_VARIANT.VIEW): State => ({
  model, content: {}, variant, isDirty: false, validation: { valid: true, properties: {} },
});

const reset = (model: Model, variant: FORM_VARIANT, initialValue?: Record<string, unknown>, from = emptyState(model)) => run(
  from,
  { type: 'RESET_FORM', payload: { model, initialValue, variant } },
);

const update = (state: State, updates: Record<string, unknown>) => run(state, { type: 'UPDATE_FORM', payload: { updates } });

describe('useSchemaForm reducer', () => {
  describe('RESET_FORM', () => {
    test('applies defaults, generated defaults and empty embedded records for new forms', () => {
      const state = reset(makeModel(), FORM_VARIANT.NEW);

      expect(state.content).toEqual({
        name: 'abc',
        slug: 'slug-abc',
        start: { '@class': 'GenomicPosition' },
        other: undefined,
      });
      expect(state.variant).toBe(FORM_VARIANT.NEW);
      expect(state.isDirty).toBe(false);
    });

    test('keeps provided values instead of defaults', () => {
      const state = reset(makeModel(), FORM_VARIANT.NEW, { name: 'given' });

      expect(state.content.name).toBe('given');
      expect(state.content.slug).toBe('slug-given');
    });

    test('replaces null with the default only for non-nullable properties', () => {
      const model = makeModel();
      model.properties.other.nullable = true;
      model.properties.other.default = 'fallback';
      const state = reset(model, FORM_VARIANT.NEW, { name: null, other: null });

      expect(state.content.name).toBe('abc');
      expect(state.content.other).toBeNull();
    });

    test('does not default read-only or generated properties', () => {
      const model = makeModel();
      model.properties.name.readOnly = true;
      model.properties.slug.generated = true;
      const state = reset(model, FORM_VARIANT.NEW);

      expect(state.content.name).toBeUndefined();
      expect(state.content.slug).toBeUndefined();
    });

    test('does not apply defaults for edit forms and marks them dirty', () => {
      const state = reset(makeModel(), FORM_VARIANT.EDIT, { other: 'value' });

      expect(state.content.name).toBeUndefined();
      expect(state.content.other).toBe('value');
      expect(state.isDirty).toBe(true);
    });

    test('view form keeps the initial value as is and skips validation', () => {
      const model = makeModel();
      model.properties.other.mandatory = true;
      const initialValue = { start: { '@class': 'GenomicPosition', pos: 1, bogus: true } };
      const state = reset(model, FORM_VARIANT.VIEW, initialValue);

      expect(state.content).toEqual(initialValue);
      expect(state.validation).toEqual({ valid: true, properties: {} });
    });

    test('uses an empty record when there is no initial value', () => {
      expect(reset(makeModel(), FORM_VARIANT.VIEW).content).toEqual({});
    });

    test('filters invalid properties from an initial embedded value', () => {
      const state = reset(makeModel(), FORM_VARIANT.EDIT, {
        start: { '@class': 'GenomicPosition', pos: 1, bogus: true },
      });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 1 });
    });

    test('validates the content', () => {
      const model = makeModel();
      model.properties.other.mandatory = true;
      const state = reset(model, FORM_VARIANT.NEW);

      expect(state.validation.valid).toBe(false);
      expect(state.validation.properties?.other).toMatchObject({ valid: false, message: 'Required Value' });
      expect(state.validation.properties?.name).toMatchObject({ valid: true });
    });

    test('is valid when all mandatory values are present', () => {
      const model = makeModel();
      model.properties.start.nullable = true;
      model.properties.other.mandatory = true;
      const state = reset(model, FORM_VARIANT.NEW, { other: 'value' });

      expect(state.validation.valid).toBe(true);
    });

    test('resets previous content, dirty flag and validation', () => {
      const model = makeModel();
      model.properties.other.mandatory = true;
      const dirty = update(reset(model, FORM_VARIANT.NEW), { other: 'changed' });
      const state = reset(model, FORM_VARIANT.VIEW, { other: 'fresh' }, dirty);

      expect(state.content).toEqual({ other: 'fresh' });
      expect(state.isDirty).toBe(false);
      expect(state.validation).toEqual({ valid: true, properties: {} });
    });
  });

  describe('SET_FORM_DIRTY', () => {
    test('marks the form dirty without changing content', () => {
      const initial = reset(makeModel(), FORM_VARIANT.NEW);
      const state = run(initial, { type: 'SET_FORM_DIRTY' });

      expect(state.isDirty).toBe(true);
      expect(state.content).toEqual(initial.content);
    });
  });

  describe('UPDATE_FORM', () => {
    test('sets the values and marks the form dirty', () => {
      const state = update(reset(makeModel(), FORM_VARIANT.NEW), { name: 'one', other: 'two' });

      expect(state.content).toMatchObject({ name: 'one', other: 'two' });
      expect(state.isDirty).toBe(true);
    });

    test('revalidates the updated values', () => {
      const model = makeModel();
      model.properties.start.nullable = true;
      model.properties.other.mandatory = true;
      const initial = reset(model, FORM_VARIANT.NEW);

      expect(initial.validation.valid).toBe(false);

      const filled = update(initial, { other: 'value' });

      expect(filled.validation.valid).toBe(true);
      expect(filled.validation.properties?.other.valid).toBe(true);
      expect(update(filled, { other: '' }).validation.valid).toBe(false);
    });

    test('dotted paths update a property of an embedded record', () => {
      let state = reset(makeModel(), FORM_VARIANT.NEW);
      state = update(state, { 'start.pos': 5 });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 5 });
    });

    test('dotted paths create a missing embedded record with the linked class', () => {
      const model = makeModel();
      const state = update(reset(model, FORM_VARIANT.EDIT, {}), { 'start.pos': 5 });

      expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 5 });
    });

    test('rebuilds displayNameTemplate when a template input changes', () => {
      const generateDefault = vi.fn((record) => `template-${record.subject}`);
      const model: Model = {
        name: 'Mock',
        properties: {
          subject: { name: 'subject', type: 'string' },
          displayNameTemplate: { name: 'displayNameTemplate', type: 'string', generateDefault },
        },
      };
      const state = update(reset(model, FORM_VARIANT.EDIT, { subject: 'a', displayNameTemplate: 'old' }), { subject: 'b' });

      expect(state.content.displayNameTemplate).toBe('template-b');
      expect(generateDefault).toHaveBeenCalledWith({ subject: 'b' });
    });

    test('leaves displayNameTemplate alone when it was not already set', () => {
      const generateDefault = vi.fn(() => 'generated');
      const model: Model = {
        name: 'Mock',
        properties: {
          subject: { name: 'subject', type: 'string' },
          displayNameTemplate: { name: 'displayNameTemplate', type: 'string', generateDefault },
        },
      };
      const state = update(reset(model, FORM_VARIANT.EDIT, { subject: 'a' }), { subject: 'b' });

      expect(state.content.displayNameTemplate).toBeUndefined();
      expect(generateDefault).not.toHaveBeenCalled();
    });

    describe('embedded value filtering', () => {
      test('removes properties which do not belong to the embedded class', () => {
        const state = update(reset(makeModel(), FORM_VARIANT.NEW), {
          start: { '@class': 'GenomicPosition', pos: 1, bogus: true },
        });

        expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 1 });
      });

      test('falls back to the linked class when the given class does not inherit from it', () => {
        const state = update(reset(makeModel(), FORM_VARIANT.NEW), {
          start: { '@class': 'Statement', bogus: true },
        });

        expect(state.content.start['@class']).toBe('GenomicPosition');
        expect(state.content.start.bogus).toBeUndefined();
      });

      test('keeps a subclass of the linked class', () => {
        const model = makeModel();
        model.properties.start.linkedClass = 'Position';
        const state = update(reset(model, FORM_VARIANT.NEW), {
          start: { '@class': 'GenomicPosition', pos: 1, bogus: true },
        });

        expect(state.content.start).toEqual({ '@class': 'GenomicPosition', pos: 1 });
      });
    });
  });

  describe('conditional properties', () => {
    const conditionalModel = (): Model => ({
      name: 'Mock',
      properties: {
        kind: { name: 'kind', type: 'string' },
        detail: { name: 'detail', type: 'string' },
      },
      conditional: (properties, form) => {
        if (form.content.kind === 'special') {
          properties.detail.mandatory = true;
        }
      },
    });

    test('applies the overrides to the model and validation when the condition is met', () => {
      const initial = reset(conditionalModel(), FORM_VARIANT.NEW);

      expect(initial.model.properties.detail.mandatory).toBeUndefined();
      expect(initial.validation.valid).toBe(true);

      const special = update(initial, { kind: 'special' });

      expect(special.model.properties.detail.mandatory).toBe(true);
      expect(special.validation.valid).toBe(false);
      expect(special.validation.properties?.detail.message).toBe('Required Value');
    });

    test('removes the overrides again when the condition stops being met', () => {
      const special = update(reset(conditionalModel(), FORM_VARIANT.NEW), { kind: 'special' });
      const ordinary = update(special, { kind: 'ordinary' });

      expect(ordinary.model.properties.detail.mandatory).toBeUndefined();
      expect(ordinary.validation.valid).toBe(true);
    });

    test('does not mutate the original model when updating', () => {
      const model = conditionalModel();
      const originalProperties = model.properties;
      update(reset(model, FORM_VARIANT.NEW), { kind: 'special' });

      expect(model.properties).toBe(originalProperties);
      expect(model.properties.detail.mandatory).toBeUndefined();
    });

    test('does not mutate the new model when resetting from a different model', () => {
      const first = conditionalModel();
      const second = conditionalModel();
      const originalProperties = second.properties;
      const state = reset(first, FORM_VARIANT.NEW, { kind: 'special' });
      reset(second, FORM_VARIANT.NEW, { kind: 'special' }, state);

      expect(second.properties).toBe(originalProperties);
      expect(second.properties.detail.mandatory).toBeUndefined();
    });
  });
});
