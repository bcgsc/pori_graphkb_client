const MOCK_SEARCH_OPTS = {
  DRUG: [
    {
      label: 'drug label 1',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
    {
      label: 'drug label 2',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
  ],
  DISEASE: [
    {
      label: 'disease label 1',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'disease label 2',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
  ],
  VARIANT: [
    {
      label: 'variant label 1',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'variant label 2',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
  ],
  GENE: [
    {
      label: 'gene label 1',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
    {
      label: 'gene label 2',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
  ],
};

export default MOCK_SEARCH_OPTS;
