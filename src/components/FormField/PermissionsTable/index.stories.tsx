import { expect, fn, within } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'permissions',
  },
});

export const Empty = meta.story();

export const WithValue = meta.story({
  args: {
    value: {
      LicenseAgreement: 15,
      Therapy: 15,
      Vocabulary: 15,
      Biomarker: 4,
      IntronicPosition: 0,
      CategoryVariant: 15,
      User: 15,
      Ontology: 4,
      Disease: 15,
      E: 4,
      Pathway: 15,
      StatementReview: 0,
      Infers: 13,
      AnatomicalEntity: 15,
      SubClassOf: 13,
      Feature: 15,
      Source: 15,
      UserGroup: 15,
      AliasOf: 13,
      OppositeOf: 13,
      ExonicPosition: 0,
      V: 4,
      Permissions: 0,
      Evidence: 4,
      ElementOf: 13,
      GeneralizationOf: 13,
      CytobandPosition: 0,
      GenomicPosition: 0,
      PositionalVariant: 15,
      RnaPosition: 0,
      Position: 0,
      Statement: 15,
      Abstract: 15,
      Publication: 15,
      CrossReferenceOf: 13,
      TargetOf: 13,
      CatalogueVariant: 15,
      CdsPosition: 0,
      Variant: 4,
      DeprecatedBy: 13,
      Signature: 15,
      ClinicalTrial: 15,
      CuratedContent: 15,
      Cites: 13,
      ProteinPosition: 0,
      EvidenceLevel: 15,
    },
  },
});

WithValue.test('clicking checkbox does not call onChange', async ({ args, canvas, userEvent }) => {
  const row = (await canvas.findByText('Disease:')).closest('tr') as HTMLElement;
  const [checkbox] = within(row).getAllByRole('checkbox');

  await userEvent.click(checkbox);

  await expect(args.onChange).toHaveBeenCalledWith({
    target: { name: args.name, value: { ...args.value, Disease: 7 } },
  });
});

export const Disabled = WithValue.extend({
  args: { disabled: true },
});

Disabled.test('checkboxes are disabled', async ({ canvas }) => {
  const row = (await canvas.findByText('Disease:')).closest('tr') as HTMLElement;
  const [checkbox] = within(row).getAllByRole('checkbox');

  await expect(checkbox).toBeDisabled();
});

export const ReadOnly = WithValue.extend({
  args: { readOnly: true },
});

ReadOnly.test('clicking checkbox does not call onChange', async ({ args, canvas, userEvent }) => {
  const row = (await canvas.findByText('Disease:')).closest('tr') as HTMLElement;
  const [checkbox] = within(row).getAllByRole('checkbox');

  await userEvent.click(checkbox);

  await expect(args.onChange).not.toHaveBeenCalled();
});
