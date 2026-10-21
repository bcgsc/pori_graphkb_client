import { schema as SCHEMA_DEFN } from '@bcgsc-pori/graphkb-schema';
import { describe, expect, test } from 'vitest';

import testSchema, { SchemaPropertyDefinition } from '../schema';

describe('schema service', () => {
  describe('Retrieving classmodels and properties', () => {
    test('gets classes properly', () => {
      Object.keys(SCHEMA_DEFN.models).forEach((key) => {
        expect(SCHEMA_DEFN.get(key)).toBeDefined();
      });
    });

    test('returns proper metadata fields', () => {
      const metadata = testSchema.getMetadata();
      const V = SCHEMA_DEFN.get('V');

      metadata.forEach((prop) => {
        expect(V.properties[prop.name]).toBeDefined();
      });
    });

    test('Returns edges', () => {
      const edges = Object.values(SCHEMA_DEFN.models)
        .filter((model) => SCHEMA_DEFN.ancestors(model.name).includes('E'))
        .map((model) => model.name);
      expect(testSchema.getEdges()).toEqual(edges);

      const testNode = {
        in_AliasOf: [
          'inalias',
        ],
        out_AliasOf: [
          'outalias',
        ],
        in_GeneralizationOf: [
          'ingeneralization',
        ],
      };
      expect(testSchema.getEdges(testNode)).toEqual(['inalias', 'outalias', 'ingeneralization']);
    });
  });

  describe('getLabel/getPreview tests', () => {
    test('returns a primitive value back', () => {
      const mockRID = '#19:0';
      const label = testSchema.getLabel(mockRID);
      expect(label).toEqual(mockRID);

      const preview = SCHEMA_DEFN.getPreview(mockRID as any);
      expect(preview).toEqual(mockRID);
    });

    test('builds displayNameTemplate correctly', () => {
      const mockStatementRecord = {
        displayName: 'displayName',
        '@class': 'Statement',
        '@rid': '22:0',
        displayNameTemplate: 'Given {conditions} {relevance} applies to {subject} ({evidence})',
        relevance: { displayName: 'Mood Swings', '@rid': '1' },
        conditions: [{ displayName: 'Low blood sugar', '@class': 'Disease', '@rid': '2' }],
        subject: { displayName: 'hungertitis', '@rid': '3', '@class': 'Disease' },
        evidence: [{ displayName: 'A reputable source', '@rid': '4' }],
      };

      const statementLabel = SCHEMA_DEFN.getPreview(mockStatementRecord);
      expect(statementLabel).toEqual('Given Low blood sugar Mood Swings applies to hungertitis (A reputable source)');
    });

    test('returns displayname label', () => {
      const mockClassModel = {
        displayName: 'displayName',
        '@class': 'Mock',
        '@rid': '22:0',
      };
      const shortLabel = testSchema.getLabel(mockClassModel);
      expect(shortLabel).toEqual('displayName (22:0)');

      const longNameModel = {
        displayName: 'super long display name that is going to go over the limit but does not get cut off because its not truncated',
        '@class': 'Mock',
      };
      const cutOffLabel = testSchema.getLabel(longNameModel, { truncate: false });
      expect(cutOffLabel).toEqual('super long display name that is going to go over the limit but does not get cut off because its not truncated');
    });

    test('Preview returns cut off displayName', () => {
      const longNameModel = {
        displayName: 'super long display name that is going to go over the limit and gets cut off because its a preview',
        '@class': 'Mock',
      };
      const cutOffLabel = testSchema.getLabel(longNameModel);
      expect(cutOffLabel).toEqual('super long display name that is going to go ove...');
    });

    // TODO: decide if we want it to capitalize DEVSU-2295
    test.skip('returns classModel name', () => {
      const classModel = {
        '@class': 'disease',
      };

      const modelLabel = SCHEMA_DEFN.getPreview(classModel);
      expect(modelLabel).toEqual('Disease');
    });

    test('defaults to name if displayName is not present', () => {
      const mockClassModel = {
        name: 'mock model',
        '@class': 'Mock',
        '@rid': '33:0',
      };
      const shortLabel = testSchema.getLabel(mockClassModel);
      expect(shortLabel).toEqual('mock model (33:0)');
    });

    test('target check', () => {
      const targetModel = {
        target: {
          displayName: 'displayName',
          '@class': 'Mock',
          '@rid': '22:0',
        },

      };

      const targetLabel = testSchema.getLabel(targetModel);
      expect(targetLabel).toEqual('displayName');
    });

    test('user model', () => {
      const userMock = {
        '@rid': '20:0',
        '@class': 'User',
        createdBy: 'Mom',
        deletedBy: 'Mom',
      };
      const label = SCHEMA_DEFN.getPreview(userMock);
      expect(label).toEqual(userMock['@class']);
    });

    test('full displayName with preview for short displayname', () => {
      const mockClassModel = {
        displayName: 'displayName',
        '@class': 'Mock',
        '@rid': '22:0',
      };
      const shortLabel = testSchema.getLabel(mockClassModel);
      expect(shortLabel).toEqual('displayName (22:0)');
    });

    test('returns rid if no other info is available', () => {
      const mockModel = {
        '@rid': '22:0',
      };
      const ridLabel = SCHEMA_DEFN.getPreview(mockModel);
      expect(ridLabel).toEqual('22:0');
    });
  });
});

test.each(
  [
    [
      {
        type: 'string' as const,
        mandatory: true,
      },
      undefined,
      { valid: false, message: 'Required Value' },
    ],
    [
      {
        type: 'string' as const,
        mandatory: true,
      },
      '',
      { valid: false, message: 'Required Value' },
    ],
    [
      {
        type: 'string' as const,
        mandatory: true,
        default: 'default value',
      },
      undefined,
      { valid: true },
    ],
    [
      {
        type: 'string' as const,
        mandatory: true,
        generated: true,
      },
      undefined,
      { valid: true },
    ],
    [
      {
        type: 'string' as const,
        mandatory: true,
        generateDefault: () => 'generated value',
      },
      undefined,
      { valid: true },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      'mock model',
      {
        valid: false,
        message: 'Value is not an object.',
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      {},
      {
        valid: true,
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      {
        '@class': 'Statement',
      },
      {
        valid: false,
        properties: { '@class': { message: 'Value "Statement" is invalid. Embedded record must be a type that inherits from type Position', valid: false } },
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      {
        '@class': 'GenomicPosition',
      },
      {
        valid: false,
        properties: { pos: { message: 'Required Value', valid: false }, '@class': { valid: true } },
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      null,
      {
        valid: false,
        message: 'Cannot be empty/null',
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
        nullable: true,
      },
      null,
      {
        valid: true,
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      { '@class': 'GenomicPosition', pos: 10 },
      {
        valid: true,
        properties: { pos: { valid: true }, '@class': { valid: true } },
      },
    ],
    [
      {
        type: 'embedded' as const,
        linkedClass: 'Position',
      },
      { '@class': 'CytoBandPosition', pos: 10 },
      {
        valid: false,
        properties: {
          arm: { valid: false, message: 'Required Value' }, majorBand: { valid: true }, minorBand: { valid: true }, '@class': { valid: true },
        },
      },
    ],
    [
      {
        type: 'embeddedset' as const,
        linkedClass: 'Position',
      },
      [{ '@class': 'GenomicPosition', pos: 10 }, { '@class': 'GenomicPosition' }],
      {
        valid: false,
        items: [
          { valid: true, properties: { pos: { valid: true }, '@class': { valid: true } } },
          { valid: false, properties: { pos: { valid: false, message: 'Required Value' }, '@class': { valid: true } } },
        ],
      },
    ],
    [
      {
        type: 'embeddedset' as const,
      },
      { hello: 'world' },
      { valid: false, message: 'Value must be an array.' },
    ],
    [
      {
        type: 'embeddedset' as const,
      },
      ['hello', 'world'],
      { valid: true },
    ],
  ],
)('validates property %j with value %j as expected', (propModel: Partial<SchemaPropertyDefinition>, value: unknown, result) => {
  const propName = 'thing';
  const iterable = propModel.type?.endsWith('set') || propModel.type?.endsWith('list');
  const errors = testSchema.validateValue({ ...propModel, iterable, name: propName }, value);

  expect(errors).toEqual(result);
});
