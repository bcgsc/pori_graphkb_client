import { expect, fn, waitFor } from 'storybook/test';

import preview, {
  http, selectOption, withAuth, withSnackbar,
} from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  decorators: [withSnackbar, withAuth],
  args: {
    onSubmit: fn(),
  },
  title: 'Views/AdvancedSearchView/PropertyFilter',
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [
          {
            '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
          },
          {
            '@class': 'Therapy', '@rid': '#111:222', count: 2, name: 'immunological therapy',
          },
        ]),
      ],
    },
  },
});

export const Default = meta.story({
  args: { modelName: 'Statement' },
});

export const ExactMatchLinkProperty = Default.extend({
  play: async ({ canvas, userEvent, args }) => {
    await selectOption(canvas, userEvent, 'relevance', /^immunotherapy/);
    await userEvent.click(await canvas.findByText(/add to selected group/i));
    await userEvent.tab();
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({
      attr: 'relevance',
      value: [expect.objectContaining({ '@rid': '#111:111', name: 'immunotherapy' })],
      operator: 'IN',
      subqueryType: '',
      query: {
        operator: 'IN',
        relevance: [expect.objectContaining({ '@rid': '#111:111', name: 'immunotherapy' })],
      },
    }));
  },
});

export const KeywordLinkProperty = Default.extend({
  play: async ({ canvas, userEvent, args }) => {
    const subqueryButton = (await canvas.findByText(/keyword/i)).closest('button')!;
    await userEvent.click(subqueryButton);
    await expect(await canvas.findByLabelText(/operator/i)).toHaveTextContent('CONTAINSTEXT');
    await userEvent.click(await canvas.findByRole('textbox', { name: /relevance/i }));
    await userEvent.paste('something');
    await userEvent.click(await canvas.findByText(/add to selected group/i));
    await userEvent.tab();
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({
      attr: 'relevance',
      value: 'something',
      operator: 'CONTAINSTEXT',
      subqueryType: 'keyword',
      query: {
        operator: 'IN',
        relevance: {
          queryType: 'similarTo',
          treeEdges: [],
          target: {
            target: 'Vocabulary',
            operator: 'CONTAINSTEXT',
            keyword: 'something',
            queryType: 'keyword',
          },
        },
      },
    }));
  },
});

export const SubclassTreeLinkProperty = Default.extend({
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(await canvas.findByText(/subclass tree/i));
    await selectOption(canvas, userEvent, 'relevance', /^immunotherapy/);
    await userEvent.click(await canvas.findByText(/add to selected group/i));
    await userEvent.tab();
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({
      attr: 'relevance',
      value: [expect.objectContaining({ '@rid': '#111:111', name: 'immunotherapy' })],
      operator: 'IN',
      subqueryType: 'tree',
      query: {
        operator: 'IN',
        relevance: {
          queryType: 'similarTo',
          treeEdges: [],
          target: {
            target: [expect.objectContaining({ '@rid': '#111:111', name: 'immunotherapy' })],
            queryType: 'ancestors',
          },
        },
      },
    }));
  },
});

export const EmbeddedProperty = meta.story({
  args: { modelName: 'PositionalVariant' },
  play: async ({ canvas, userEvent, args }) => {
    await selectOption(canvas, userEvent, 'Property', /^break1Start/);
    await userEvent.click(await canvas.findByRole('textbox', { name: /@class/i }));
    await userEvent.paste('ProteinPosition');
    await userEvent.click(await canvas.findByText(/add to selected group/i));
    await userEvent.tab();
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({
      attr: 'break1Start.@class',
      value: 'ProteinPosition',
      operator: '=',
      subqueryType: '',
      query: {
        operator: '=',
        'break1Start.@class': 'ProteinPosition',
      },
    }));
  },
});
