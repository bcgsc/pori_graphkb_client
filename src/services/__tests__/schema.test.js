import { schema as SCHEMA_DEFN } from '@bcgsc/knowledgebase-schema';
import Schema from '../schema';


describe('Schema wrapper class tests', () => {
  const testSchema = new Schema(SCHEMA_DEFN);
  describe('Retrieving classmodels and properties', () => {
    it('gets classes properly', () => {
      Object.keys(SCHEMA_DEFN).forEach((key) => {
        expect(testSchema.get(key)).toBeDefined();
      });
    });
    it('returns proper metadata fields', () => {
      const metadata = testSchema.getMetadata();
      const V = testSchema.get('V');

      metadata.forEach((prop) => {
        expect(V.properties[prop.name]).toBeDefined();
      });
    });
    it('returns the right properties list', () => {
      const ontology = testSchema.get('Ontology');
      const testProps = testSchema.getProperties('Ontology');

      testProps.forEach((prop) => {
        expect(ontology.properties[prop.name]).toBeDefined();
      });
    });
    it('Returns edges', () => {
      const edges = Object.values(testSchema.schema)
        .filter(model => model.inherits && model.inherits.includes('E'))
        .map(model => model.name);
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
  describe('getLabel/getPreview tests ', () => {
    it('returns a primitive value back', () => {
      const mockRID = '#19:0';
      const label = testSchema.getLabel(mockRID);
      expect(label).toEqual(mockRID);

      const preview = testSchema.getPreview(mockRID);
      expect(preview).toEqual(mockRID);
    });

    it('builds displayNameTemplate correctly', () => {
      const mockStatementRecord = {
        displayName: 'displayName',
        '@class': 'Mock',
        '@rid': '22:0',
        displayNameTemplate: 'Given {impliedBy} {relevance} applies to {appliesTo} ({supportedBy})',
        relevance: { displayName: 'Mood Swings' },
        impliedBy: [{ displayName: 'Low blood sugar' }],
        appliesTo: [{ displayName: 'hungertitis' }],
        supportedBy: [{ displayName: 'A reputable source' }],
      };

      const statementLabel = testSchema.getLabel(mockStatementRecord, false);
      expect(statementLabel).toEqual('Given Low blood sugar  Mood Swings  applies to hungertitis  (A reputable source )');
    });

    it('returns displayname label', () => {
      const mockClassModel = {
        displayName: 'displayName',
        '@class': 'Mock',
        '@rid': '22:0',
      };
      const shortLabel = testSchema.getLabel(mockClassModel);
      expect(shortLabel).toEqual('displayName (22:0)');

      const longNameModel = {
        displayName: 'super long display name that is going to go over the limit but does not get cut off because its not a preview',
        '@class': 'Mock',
      };
      const cutOffLabel = testSchema.getLabel(longNameModel);
      expect(cutOffLabel).toEqual('super long display name that is going to go over the limit but does not get cut off because its not a preview');
    });

    it('Preview returns cut off displayName', () => {
      const longNameModel = {
        displayName: 'super long display name that is going to go over the limit and gets cut off because its a preview',
        '@class': 'Mock',
      };
      const cutOffLabel = testSchema.getPreview(longNameModel);
      expect(cutOffLabel).toEqual('super long display name that is going to go ove...');
    });

    it('returns classModel name', () => {
      const classModel = {
        '@class': 'disease',
      };

      const modelLabel = testSchema.getPreview(classModel);
      expect(modelLabel).toEqual('Disease');
    });

    it('defaults to name if displayName is not present', () => {
      const mockClassModel = {
        name: 'mock model',
        '@class': 'Mock',
        '@rid': '33:0',
      };
      const shortLabel = testSchema.getLabel(mockClassModel);
      expect(shortLabel).toEqual('mock model (33:0)');
    });

    it('target check', () => {
      const targetModel = {
        target: {
          displayName: 'displayName',
          '@class': 'Mock',
          '@rid': '22:0',
        },
      };

      const targetLabel = testSchema.getLabel(targetModel);
      expect(targetLabel).toEqual('displayName (22:0)');
    });

    it('user model', () => {
      const userMock = {
        '@rid': '20:0',
        '@class': 'User',
        createdBy: 'Mom',
        deletedBy: 'Mom',
      };
      const label = testSchema.getLabel(userMock);
      expect(label).toEqual(userMock['@class']);
    });

    it('full displayName with preview for short displayname', () => {
      const mockClassModel = {
        displayName: 'displayName',
        '@class': 'Mock',
        '@rid': '22:0',
      };
      const shortLabel = testSchema.getPreview(mockClassModel);
      expect(shortLabel).toEqual('displayName (22:0)');
    });

    it('returns rid if no other info is available', () => {
      const mockModel = {
        '@rid': '22:0',
      };
      const ridLabel = testSchema.getPreview(mockModel);
      expect(ridLabel).toEqual('22:0');
    });
  });
});
