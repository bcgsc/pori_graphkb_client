export const defaultProps = {
  get: () => ([
    '@rid',
    '@class',
    'preview',
    'relevance.source',
    'relevance.sourceId',
    'relevance.name',
    'appliesTo.source',
    'appliesTo.sourceId',
    'appliesTo.name',
    'appliesTo.@class',
    'description',
    'reviewStatus',
    'sourceId',
    'source.name',
    'source.url',
    'source.description',
    'source.usage',
    'appliesTo.description',
    'appliesTo.subsets',
    'appliesTo.sourceIdVersion',
    'appliesTo.mechanismOfAction',
    'relevance.description',
    'appliesTo.dependency',
  ]),
}

export default {
  defaultProps,
};
