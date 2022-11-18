declare module '@bcgsc-pori/graphkb-schema' {
  interface PropertyDefinition {
    type: string;
    name: string;
    linkedClass?: ModelDefinition;
    mandatory?: boolean;
    linkedType?: string;
    generateDefault?: (obj: unknown) => unknown;
    validate?: (value: unknown) => void;
    description?: string;
    choices?: string[];
    [key: string]: unknown | undefined;
  }

  interface ModelDefinition {
    name: string;
    reverseName: string;
    isEdge?: boolean;
    routeName: string;
    queryProperties: Record<string, PropertyDefinition>;
    properties: Record<string, PropertyDefinition>;
    subclasses: ModelDefinition[];
    inherits: string[];
    embedded?: boolean;
    isAbstract?: boolean;
    description?: string;
    descendantTree: (excludeAbstract?: boolean) => ModelDefinition[];
    sourceModel?: string | null;
    targetModel?: string | null;
  }

  namespace Property {
    function validateWith(propModel: PropertyDefinition, value: unknown): void;
  }

  namespace schema {
    let schema: Record<string, ModelDefinition>;
    function getPreview(node: unknown | null, arg2?: boolean): string;
    function getFromRoute(modelName: string): ModelDefinition | undefined;
    function get(obj: 'V' | 'v' | 'E' | 'e' | 'Ontology' | 'Statement' | 'StatementReview'): ModelDefinition;
    function get(obj: unknown): ModelDefinition | undefined;
    function has(obj: unknown): boolean;
  }

  namespace constants {
    let REVIEW_STATUS: string[];
    let EXPOSE_ALL: Record<string, boolean>;
    let EXPOSE_NONE: Record<string, boolean>;
    let EXPOSE_EDGE: Record<string, boolean>;
    let EXPOSE_READ: Record<string, boolean>;
    let FUZZY_CLASSES: string[];
    let INDEX_SEP_CHARS: string;
    let PERMISSIONS: Record<string, number>;
    let RID: string;
  }

  namespace sentenceTemplates {
    function generateStatementSentence(schemaDefn: typeof schema, record: unknown): { content: string; highlighted: string[] };
  }

  namespace util {
    function looksLikeRID(text: string, arg2?: boolean): boolean;
  }

  export {
    constants, Property, schema, sentenceTemplates, util,
  };
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}
