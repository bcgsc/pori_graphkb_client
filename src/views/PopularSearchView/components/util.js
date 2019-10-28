import api from '../../../services/api';

const MAX_RESULT_COUNT = 400;

const vocabularyRIDGenerator = async (vocabName) => {
  const sensitivityRIDSearch = {
    target: 'Vocabulary',
    filters: { name: vocabName },
    returnProperties: ['@rid'],
  };
  const call = api.post('/query', sensitivityRIDSearch);
  const record = await call.request();
  const [vocab] = record;
  const { '@rid': rid } = vocab;
  return rid;
};
/**
 * returns a keyword search object with rid
 */
const keywordSearchGenerator = (modelName, keyword, returnProperties = ['@rid']) => ({
  queryType: 'keyword',
  keyword,
  target: modelName,
  returnProperties,
});

const getRIDs = async (search) => {
  const call = api.post('/query', search);
  const records = await call.request();
  const ridArr = records.map(rec => rec['@rid']);
  return ridArr;
};

const searchCount = async (search) => {
  const searchObj = { ...search, count: true };
  delete searchObj.returnProperties;
  const call = api.post('/query', searchObj);
  const [result] = await call.request();
  const { count } = result;
  return count;
};

const searchCountCheck = async (search) => {
  const count = await searchCount(search);
  return (count < MAX_RESULT_COUNT && count !== 0);
};

const setSubQuery = async (search) => {
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

const getOptionalSubQuery = async (search) => {
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
      },
    },
    {
      label: 'Given a drug, find all diseases it is approved for use',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
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
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsClause(search) { this.search.filters.AND[0].conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');

        const search = keywordSearchGenerator('Disease', keyword);
        this.conditionsClause = await setSubQuery(search);
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
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsClause(search) { this.search.filters.AND[0].conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        const search = keywordSearchGenerator('Disease', keyword);
        this.conditionsClause = await setSubQuery(search);
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
      set searchInput(keyword) { this.search.filters.AND[0].conditions.target.keyword = keyword; },
      async buildSearch(keyword) { this.searchInput = keyword; },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associated with sensitivity for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
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
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      get conditionsClauseArr() { return this.search.filters.AND[0].AND; },
      async buildSearch(keyword, optionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');

        const search = keywordSearchGenerator('Variant', keyword);
        const conditionArr = this.conditionsClauseArr;
        conditionArr[0].conditions = await setSubQuery(search);

        if (optionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: optionalInput, operator: 'CONTAINSTEXT' },
          };
          const diseaseCondition = await getOptionalSubQuery(diseaseSearch);
          conditionArr.push(diseaseCondition);
        }
      },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
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
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      get conditionsClauseArr() { return this.search.filters.AND[0].AND; },
      async buildSearch(keyword, optionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        const search = keywordSearchGenerator('Variant', keyword);
        const conditionArr = this.conditionsClauseArr;
        conditionArr[0].conditions = await setSubQuery(search);


        if (optionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: optionalInput, operator: 'CONTAINSTEXT' },
          };

          const diseaseCondition = await getOptionalSubQuery(diseaseSearch);
          conditionArr.push(diseaseCondition);
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
      set conditions(search) { this.search.filters.conditions = search; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        const search = keywordSearchGenerator('Variant', keyword);
        this.conditions = await setSubQuery(search);
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
      set conditions(search) { this.search.filters.conditions = search; },
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
      },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Melanoma',
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
      get conditionsClause() { return this.search.filters.AND; },
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


        const diseaseSearch = {
          target: 'Disease',
          filters: { name: disease, operator: 'CONTAINSTEXT' },
          returnProperties: ['@rid'],
        };

        clause[1].conditions = await setSubQuery(diseaseSearch);
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
      set relevanceRIDs(ridArr) { this.search.filters.AND[1].relevance = ridArr; },
      set conditions(search) { this.search.filters.AND[0].conditions = search; },
      async buildSearch(keyword) {
        const sensitivityRID = await vocabularyRIDGenerator('sensitivity');
        const resistanceRID = await vocabularyRIDGenerator('resistance');
        this.relevanceRIDs = [sensitivityRID, resistanceRID];

        const geneSearch = {
          target: 'Feature',
          filters: {
            AND: [{ biotype: 'gene' }, { name: keyword }],
          },
          returnProperties: ['@rid'],
        };
        this.conditions = await setSubQuery(geneSearch);
      },
    },
    {
      label: 'Given a gene, find all variants on the gene',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Variant',
        filters: {
          OR: [
            {
              reference1: {
                queryType: 'similarTo',
                target: {
                  target: 'Feature',
                  filters: {
                    AND: [{ biotype: 'gene' }, { OR: [{ name: '<GENE>' }, { sourceId: '<GENE>' }] }],
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
                    AND: [{ biotype: 'gene' }, { OR: [{ name: '<GENE>' }, { sourceId: '<GENE>' }] }],
                  },

                },
              },
              operator: 'IN',
            },
          ],
        },
      },
      set searchInput(keyword) {
        this.search.filters.OR[0].reference1.target.filters.AND[1].OR[0].name = keyword;
        this.search.filters.OR[0].reference1.target.filters.AND[1].OR[1].sourceId = keyword;
        this.search.filters.OR[1].reference2.target.filters.AND[1].OR[0].name = keyword;
        this.search.filters.OR[1].reference2.target.filters.AND[1].OR[1].sourceId = keyword;
      },
      async buildSearch(keyword) {
        this.searchInput = keyword;
      },
    },
  ],
};

export {
  SEARCH_OPTS,
};
