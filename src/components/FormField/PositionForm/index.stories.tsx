import { expect, fn } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'break1Start',
  },
});

export const NoVariantEmpty = meta.story();

export const GenomicPositionVariant = meta.story({
  args: {
    value: { '@class': 'GenomicPosition' },
    variant: 'GenomicPosition',
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
  args: { readOnly: true },
});

export const ProteinPositionVariant = meta.story({
  args: {
    value: { '@class': 'ProteinPosition' },
    variant: 'ProteinPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/)).toBeInTheDocument();
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
  args: { readOnly: true },
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
    await expect(canvas.queryByLabelText(/position/i)).not.toBeInTheDocument();
  },
});

CytobandPositionVariant.test('handler is called when user changes fields', async ({ canvas, userEvent, args }) => {
  await userEvent.type(await canvas.findByLabelText(/arm/i), 'p');
  await userEvent.type(await canvas.findByLabelText(/majorBand/i), '1');
  await userEvent.type(await canvas.findByLabelText(/minorBand/i), '2');

  expect(args.onChange).toHaveBeenLastCalledWith({
    target: {
      name: 'break1Start',
      value: {
        '@class': 'CytobandPosition', arm: 'p', majorBand: '1', minorBand: '2',
      },
    },
  });
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
  args: { readOnly: true },
});

export const CdsPositionVariant = meta.story({
  args: {
    value: { '@class': 'CdsPosition' },
    variant: 'CdsPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/i)).toBeInTheDocument();
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
  args: { readOnly: true },
});

export const GenomicPositionBaseVariant = meta.story({
  args: {
    baseVariant: 'GenomicPosition',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/position/i)).toBeInTheDocument();
    await expect(canvas.queryByLabelText(/offset/i)).not.toBeInTheDocument();
  },
});
