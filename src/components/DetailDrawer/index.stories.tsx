import React from 'react';
import { expect } from 'storybook/test';

import preview, { withAuth, withRouter } from '#.storybook/preview';

import component from '.';

const meta = preview.meta({
  component,
  decorators: [withAuth, withRouter],
});

export const NoNode = meta.story({
  args: { auth: { hasWriteAccess: true } },
});

export const OntologyNode = meta.story({
  args: {
    auth: { hasWriteAccess: true },
    node: {
      '@class': 'Ontology',
      // 1st long field
      name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      // 2nd long field
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      displayName: 'testNode',
      sourceId: 'test sourceId',
      conditions: [
        {
          '@class': 'Ontology',
          '@rid': '19:1',
          displayName: 'linkedRecord1',
          sourceId: 'BBC',
        },
        {
          '@class': 'Ontology',
          '@rid': '19:1',
          displayName: 'linkedRecord2',
          sourceId: 'CBC',
        },
      ],
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
      '@rid': '#1:0',
      in_AliasOf: [{
        '@class': 'AliasOf',
        '@rid': '#141:2',
        in: {
          '@rid': '#135:0',
        },
        out: {
          '@class': 'AliasOf',
          '@rid': '#136:0',
          source: {
            name: 'test source also',
          },
          name: 'hello',
        },
      }],
    },
  },
});

export const OntologyNodeMetadataExpanded = OntologyNode.extend({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('Metadata'));
    await expect(await canvas.findByText('Ontology')).toBeInTheDocument();
  },
});

export const OntologyRelationshipExpanded = OntologyNode.extend({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('AliasOf'));
    await expect(await canvas.findByText('Linked Record')).toBeInTheDocument();
  },
});

export const StatementNodeLinksExpanded = meta.story({
  args: {
    auth: { hasWriteAccess: true },
    node: {
      '@class': 'Statement',
      displayName: 'statementNode',
      sourceId: 'test sourceId',
      conditions: [
        {
          '@class': 'Ontology',
          '@rid': '19:1',
          displayName: 'linkedRecord1',
          sourceId: 'BBC',
        },
        {
          '@class': 'Ontology',
          '@rid': '19:2',
          displayName: 'linkedRecord2',
          sourceId: 'CBC',
        },
      ],
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
      '@rid': '#12:0',
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('linkedRecord1 (19:1)'));
    await userEvent.click(await canvas.findByText('linkedRecord2 (19:2)'));
    await expect(await canvas.findByText('BBC')).toBeInTheDocument();
    await expect(await canvas.findByText('CBC')).toBeInTheDocument();
  },
});
