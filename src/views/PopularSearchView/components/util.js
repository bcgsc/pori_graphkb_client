import kbp from '@bcgsc/knowledgebase-parser';

import api from '@/services/api';
import schema from '@/services/schema';


const MAX_RESULT_COUNT = 300;

/**
 * Given vocabulary term, returns rid of term if it exists
 */
const vocabularyRIDGenerator = async (vocabName) => {
  const search = {
    target: 'Vocabulary',
    filters: { name: vocabName },
    returnProperties: ['@rid'],
  };
  const call = api.post('/query', search);
  const record = await call.request();
  const [vocab] = record;
  const { '@rid': rid } = vocab;
  return rid;
};
/**
 * returns a keyword search object with rid set for return properties
 */
const keywordSearchGenerator = (modelName, keyword, returnProperties = ['@rid']) => ({
  queryType: 'keyword',
  keyword,
  target: modelName,
  returnProperties,
});

/**
 * Given a search object, returns an array of record rids
 */
const getRIDs = async (search = {}) => {
  const call = api.post('/query', search);
  const records = await call.request();
  const ridArr = records.map(rec => rec['@rid']);
  return ridArr;
};

/**
 * returns record count for given search object.
 */
const searchCount = async (search = {}) => {
  const searchObj = { ...search, count: true };
  delete searchObj.returnProperties;
  const call = api.post('/query', searchObj);
  const [result] = await call.request();
  const { count } = result;
  return count;
};

/**
 * returns bool indicating if search count is in acceptable range
 */
const searchCountCheck = async (search = {}) => {
  const count = await searchCount(search);
  return (count < MAX_RESULT_COUNT && count !== 0);
};

/**
 * Given a search, returns the search itself or an array of RIDs from
 * the search depending on whether or not the search count is below
 * an acceptable cap.
 */
const setSubQuery = async (search = {}) => {
  const countIsAcceptable = await searchCountCheck(search);
  const searchCpy = { ...search };

  let subQuery;

  if (countIsAcceptable) {
    subQuery = await getRIDs(search);
  } else {
    delete searchCpy.returnProperties;
    subQuery = searchCpy;
  }

  return subQuery;
};

/**
 * Returns an additional condition to be included in search query.
 */
const getOptionalSubQuery = async (search = {}) => {
  const countIsAcceptable = await searchCountCheck(search);
  let condition;

  if (countIsAcceptable) {
    condition = { conditions: await getRIDs(search), operator: 'CONTAINS' };
  } else {
    condition = { conditions: search, operator: 'CONTAINSANY' };
  }
  return condition;
};

const isSearchNestedSubQuery = search => !Array.isArray(search);


const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'relevance rid', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        drug: 'user input',
        drugChip: 'all variants associated with therapeutic sensitivity',
      },
      set drug(drug) { this.searchChipProps.drug = drug; },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      get subjectClause() { return this.search.filters.AND[0]; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');

        const search = keywordSearchGenerator('Therapy', keyword);
        const subjectCondition = this.subjectClause;
        subjectCondition.subject = await setSubQuery(search);

        if (isSearchNestedSubQuery(subjectCondition.subject)) {
          subjectCondition.operator = 'CONTAINSANY';
        }

        this.drug = keyword;
      },
    },
    {
      label: 'Given a drug, find all variants associated with resistance',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'resistance RID', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        drug: 'user input',
        drugChip: 'all variants associated with therapeutic resistance',
      },
      set drug(drug) { this.searchChipProps.drug = drug; },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      get subjectClause() { return this.search.filters.AND[0]; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        const search = keywordSearchGenerator('Therapy', keyword);
        const subjectCondition = this.subjectClause;
        subjectCondition.subject = await setSubQuery(search);

        if (isSearchNestedSubQuery(subjectCondition.subject)) {
          subjectCondition.operator = 'CONTAINSANY';
        }

        this.drug = keyword;
      },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['RID Arr'], operator: 'IN',
            },
            {
              relevance: ['RID Arr'], operator: 'IN',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        drug: 'user input',
        drugChip: 'all variants with pharmacogenomic information',
      },
      set drug(drug) { this.searchChipProps.drug = drug; },
      get relevanceClause() { return this.search.filters.AND[1]; },
      get therapyClause() { return this.search.filters.AND[0]; },
      async buildSearch(keyword) {
        const relevanceSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Vocabulary',
            filters: { name: 'pharmacogenomic' },
          },
          returnProperties: ['@rid'],
        };
        const relevanceCondition = this.relevanceClause;
        relevanceCondition.relevance = await setSubQuery(relevanceSearch);

        const therapySearch = keywordSearchGenerator('Therapy', keyword);
        const therapyCondition = this.therapyClause;
        therapyCondition.subject = await setSubQuery(therapySearch);
        this.drug = keyword;
      },
    },
    {
      label: 'Given a drug, find all high-level evidence statements',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug RIDs'], operator: 'IN',
            },
            {
              evidenceLevel: ['evidence level RIDs'],
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        drug: 'user input',
        drugChip: 'all high-level evidence statements',
      },
      set drug(drug) { this.searchChipProps.drug = drug; },
      set evidenceLevelClause(subQuery) { this.search.filters.AND[1].evidenceLevel = subQuery; },
      set therapyClause(subQuery) { this.search.filters.AND[0].subject = subQuery; },
      async buildSearch(keyword) {
        const therapySearch = keywordSearchGenerator('Therapy', keyword);
        this.therapyClause = await setSubQuery(therapySearch);

        const evidenceSearch = {
          target: 'EvidenceLevel',
          filters: {
            OR: [
              {
                AND: [
                  {
                    name: ['1', 'r1'],
                  },
                  {
                    source: {
                      target: 'Source',
                      filters: { name: 'OncoKB' },
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    name: ['a4', 'a5'], operator: 'IN',
                  },
                  {
                    source: {
                      target: 'Source',
                      filters: { name: 'CIViC' },
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    name: ['fda guidelines', 'nccn guidelines', 'nccn/cap guidelines'], operator: 'IN',
                  },
                  {
                    source: {
                      target: 'Source',
                      filters: { name: 'CGI' },
                    },
                  },
                ],
              },
            ],
          },
        };
        this.evidenceLevelClause = await setSubQuery(evidenceSearch);
        this.drug = keyword;
      },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: ['loose match to gene RIDs'], operator: 'CONTAINSANY',
            },
            {
              relevance: 'sensitivityRID', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        disease: 'user input',
        diseaseChip: 'all genes associated with therapeutic sensitivity',
      },
      set disease(disease) { this.searchChipProps.disease = disease; },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsClause(search) { this.search.filters.AND[0].conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');

        const search = keywordSearchGenerator('Disease', keyword);
        this.conditionsClause = await setSubQuery(search);
        this.disease = keyword;
      },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              relevance: 'resistance rid', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        disease: 'user input',
        diseaseChip: 'all genes associated with therapeutic resistance',
      },
      set disease(disease) { this.searchChipProps.disease = disease; },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsClause(search) { this.search.filters.AND[0].conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        const search = keywordSearchGenerator('Disease', keyword);
        this.conditionsClause = await setSubQuery(search);
        this.disease = keyword;
      },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: {
                queryType: 'similarTo',
                target: {
                  queryType: 'keyword',
                  keyword: 'DISEASE OF INTEREST',
                  target: 'Disease',
                },
              },
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        disease: 'user input',
        diseaseChip: 'all variants associated with a relevance',
      },
      set disease(disease) { this.searchChipProps.disease = disease; },
      set searchInput(keyword) { this.search.filters.AND[0].conditions.target.keyword = keyword; },
      async buildSearch(keyword) {
        this.searchInput = keyword;
        this.disease = keyword;
      },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associated with sensitivity for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer', optional: true,
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              AND: [{ conditions: [], operator: 'CONTAINSANY' }],
            },
            {
              relevance: [], operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        variant: 'user input',
        disease: 'not specified',
        variantChip: 'all therapies associated with sensitivity for Disease(s)',
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set variant(variant) { this.searchChipProps.variant = variant; },
      set disease(disease) { this.searchChipProps.disease = disease; },
      get conditionsClauseArr() { return this.search.filters.AND[0].AND; },
      async buildSearch(keyword, additionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');

        let search;

        try {
          const parsed = kbp.variant.parse(keyword);
          search = api.buildSearchFromParseVariant(schema, parsed);
        } catch (err) {
          search = keywordSearchGenerator('Variant', keyword);
        }

        const conditionArr = this.conditionsClauseArr;
        conditionArr[0].conditions = await setSubQuery(search);
        this.variant = keyword;

        if (additionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: additionalInput, operator: 'CONTAINSTEXT' },
          };
          const diseaseCondition = await getOptionalSubQuery(diseaseSearch);
          conditionArr.push(diseaseCondition);
          this.disease = additionalInput;
        }
      },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer', optional: true,
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              AND: [{ conditions: [], operator: 'CONTAINSANY' }],
            },
            {
              relevance: 'resistance rid', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        variant: 'user input',
        disease: 'not specified',
        variantChip: 'all therapies associated with resistance for Disease(s)',
      },
      set variant(variant) { this.searchChipProps.variant = variant; },
      set disease(disease) { this.searchChipProps.disease = disease; },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      get conditionsClauseArr() { return this.search.filters.AND[0].AND; },
      async buildSearch(keyword, additionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        let search;

        try {
          const parsed = kbp.variant.parse(keyword);
          search = api.buildSearchFromParseVariant(schema, parsed);
        } catch (err) {
          search = keywordSearchGenerator('Variant', keyword);
        }
        const conditionArr = this.conditionsClauseArr;
        conditionArr[0].conditions = await setSubQuery(search);
        this.variant = keyword;


        if (additionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: additionalInput, operator: 'CONTAINSTEXT' },
          };

          const diseaseCondition = await getOptionalSubQuery(diseaseSearch);
          conditionArr.push(diseaseCondition);
          this.disease = additionalInput;
        }
      },
    },
    {
      label: 'Given a variant, find all diseases that the variant is associated with',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      search: {
        target: 'Statement',
        filters: {
          conditions: [], operator: 'CONTAINSANY',
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        variant: 'user input',
        variantChip: 'all diseases associated with variant',
      },
      set variant(variant) { this.searchChipProps.variant = variant; },
      set conditions(search) { this.search.filters.conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        let search;

        try {
          const parsed = kbp.variant.parse(keyword);
          search = api.buildSearchFromParseVariant(schema, parsed);
        } catch (err) {
          search = keywordSearchGenerator('Variant', keyword);
        }
        this.conditions = await setSubQuery(search);
        this.variant = keyword;
      },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Statement',
        filters: {
          conditions: ['list of genes'], operator: 'CONTAINSANY',
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        gene: 'user input',
        geneChip: 'variants reported for all diseases',
      },
      set conditions(search) { this.search.filters.conditions = search; },
      set keyword(keyword) { this.searchChipProps.gene = keyword; },
      async buildSearch(keyword) {
        const geneSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Feature',
            filters: {
              AND: [
                {
                  biotype: 'gene',
                },
                {
                  name: keyword,
                },
              ],
            },
          },
          returnProperties: ['@rid'],
        };

        this.conditions = await setSubQuery(geneSearch);
        this.keyword = keyword;
      },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Melanoma', optional: false,
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              conditions: 'specific disease', operator: '=',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        gene: 'user input',
        disease: 'user input',
        geneChip: 'specific disease and the associated relevances',
      },
      get conditionsClause() { return this.search.filters.AND; },
      set gene(gene) { this.searchChipProps.gene = gene; },
      set disease(disease) { this.searchChipProps.disease = disease; },
      async buildSearch(keyword, disease) {
        const geneSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Feature',
            filters: {
              AND: [
                {
                  biotype: 'gene',
                },
                {
                  name: keyword,
                },
              ],
            },
          },
          returnProperties: ['@rid'],
        };

        const clause = this.conditionsClause;
        clause[0].conditions = await setSubQuery(geneSearch);
        this.gene = keyword;


        const diseaseSearch = {
          target: 'Disease',
          filters: { name: disease, operator: 'CONTAINSTEXT' },
          returnProperties: ['@rid'],
        };

        clause[1].conditions = await setSubQuery(diseaseSearch);
        this.disease = disease;
      },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              relevance: ['relevance RIDs'], operator: 'IN',
            },
          ],
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        gene: 'user input',
        geneChip: 'variants linked with drug sensitivity or resistance',
      },
      set relevanceRIDs(ridArr) { this.search.filters.AND[1].relevance = ridArr; },
      set conditions(search) { this.search.filters.AND[0].conditions = search; },
      set gene(gene) { this.searchChipProps.gene = gene; },
      async buildSearch(keyword) {
        const sensitivityRID = await vocabularyRIDGenerator('sensitivity');
        const resistanceRID = await vocabularyRIDGenerator('resistance');
        this.relevanceRIDs = [sensitivityRID, resistanceRID];

        const geneSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Feature',
            filters: {
              AND: [{ biotype: 'gene' }, { name: keyword }],
            },
          },
          returnProperties: ['@rid'],
        };
        this.conditions = await setSubQuery(geneSearch);
        this.gene = keyword;
      },
    },
    {
      label: 'Given a gene, find all variants on the gene',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Statement',
        filters: {
          conditions: [], operator: 'CONTAINSANY',
        },
      },
      searchChipProps: {
        searchType: 'Popular',
        gene: 'user input',
        geneChip: 'all variants on the gene',
      },
      set conditions(keyword) {
        this.search.filters.conditions = keyword;
      },
      set gene(gene) { this.searchChipProps.gene = gene; },
      async buildSearch(keyword) {
        const variantSearch = {
          target: 'Variant',
          filters: {
            OR: [
              {
                reference1: {
                  queryType: 'similarTo',
                  target: {
                    target: 'Feature',
                    filters: {
                      AND: [{ biotype: 'gene' }, { OR: [{ name: keyword }, { sourceId: keyword }] }],
                    },

                  },
                },
                operator: 'IN',
              },
              {
                reference2: {
                  queryType: 'similarTo',
                  target: {
                    target: 'Feature',
                    filters: {
                      AND: [{ biotype: 'gene' }, { OR: [{ name: keyword }, { sourceId: keyword }] }],
                    },

                  },
                },
                operator: 'IN',
              },
            ],
          },
        };

        this.conditions = await setSubQuery(variantSearch);
        this.gene = keyword;
      },
    },
  ],
};

export default SEARCH_OPTS;
