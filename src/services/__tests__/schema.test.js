import { schema as SCHEMA_DEFN } from '@bcgsc/knowledgebase-schema';
import Schema from '../schema';


describe('Schema wrapper class tests', () => {
  describe('Retrieving classmodels and properties', () => {
    const testSchema = new Schema(SCHEMA_DEFN);
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
});
