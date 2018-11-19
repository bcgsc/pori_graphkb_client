/*eslint-disable*/
/**
 * Repsonsible for defining the schema.
 */
const uuidV4 = require('uuid/v4');
const omit = require('lodash.omit');

const {position, variant} = require('@bcgsc/knowledgebase-parser');


const {
    PERMISSIONS, EXPOSE_NONE, EXPOSE_ALL, INDEX_SEP_CHARS, DEFAULT_IDENTIFIERS
} = require('./constants');
const {ClassModel} = require('./model');
const {Property} = require('./property');
const {
    castString,
    castToRID,
    castUUID,
    timeStampNow,
    uppercase,
    trimString,
    inheritField
} = require('./util');
const {AttributeError} = require('./error');


/**
 * Given some set of positions, create position object to check they are valid
 * and create the breakpoint representation strings from them that are used for indexing
 */
const generateBreakRepr = (start, end) => {
    if (!start && !end) {
        return undefined;
    }
    if ((start && !start['@class']) || (end && !end['@class'])) {
        throw new AttributeError('positions must include the @class attribute to specify the position type');
    }
    if ((end && !start)) {
        throw new AttributeError('both start and end are required to define a range');
    }
    const posClass = start['@class'];
    const repr = position.breakRepr(
        position.PREFIX_CLASS[posClass],
        new position[posClass](start),
        end
            ? new position[posClass](end)
            : null
    );
    return repr;
};


/**
 * Assigns a default getPreview function to the ClassModel. Chooses the first identifier
 * property found on the model instance.
 * @param {ClassModel} classModel - ClassModel object that will have the defaultPreview
 * implementation attached to it.
 */
const defaultPreview = classModel => (item) => {
    const {identifiers} = classModel;
    for (let i = 0; i < identifiers.length; i++) {
        const [identifier, subId] = identifiers[i].split('.');
        if (item[identifier]) {
            return subId
                ? castString(item[identifier][subId])
                : castString(item[identifier]);
        }
    }
    return 'Invalid Record';
};

// Special preview functions
const previews = {
    Source: item => item.name,
    // Name is usually more aesthetically pleasing, sourceId is mandatory for fallback.
    Ontology: item => item.name || item.sourceId,
    // Source and sourceId are mandatory, and name is mandatory on source.
    Publication: item => `${item.source.name}: ${item.sourceId}`,
    // Use kb parser to find HGVS notation
    PositionalVariant: (item) => {
        const {
            break1Start,
            break1End,
            break2Start,
            break2End,
            untemplatedSeq,
            untemplatedSeqSize,
            truncation
        } = item;

        const variantNotation = {
            break1Start,
            break1End,
            break2Start,
            break2End,
            untemplatedSeq,
            untemplatedSeqSize,
            truncation
        };

        variantNotation.prefix = position.CLASS_PREFIX[break1Start['@class']];
        ['reference1', 'reference2', 'type'].forEach((key) => {
            if (item[key] && item[key]['@class']) {
                // Stringify linked records
                variantNotation[key] = SCHEMA_DEFN[item[key]['@class']].getPreview(item[key]);
            } else {
                variantNotation[key] = item[key];
            }
        });
        return (new variant.VariantNotation(variantNotation)).toString();
    },
    // Format type and references
    CategoryVariant: (item) => {
        const {
            type,
            reference1,
            reference2
        } = item;
        // reference1 and type are mandatory
        const t = SCHEMA_DEFN.Vocabulary.getPreview(type);
        const r1 = SCHEMA_DEFN.Feature.getPreview(reference1) || '';
        const r1t = reference1.biotype;

        const r2 = (reference2 && SCHEMA_DEFN.Feature.getPreview(reference2)) || '';
        const r2t = (reference2 && reference2.biotype) || '';
        return `${t} variant on ${r1t && `${r1t} `}${r1}${r2 && ` and ${r1t && `${r2t} `}${r2}`}`;
    },
    // Formats relevance and ontology that statement applies to.
    Statement: (item) => {
        const {relevance, appliesTo} = item;
        const rel = (relevance && SCHEMA_DEFN.Vocabulary.getPreview(relevance)) || '';
        const appl = (appliesTo && ` to ${SCHEMA_DEFN[appliesTo['@class']].getPreview(appliesTo)}`) || '';
        return `${rel}${appl}`;
    }
};

const SCHEMA_DEFN = {
    V: {
        expose: EXPOSE_NONE,
        properties: [
            {
                name: '@rid',
                pattern: '^#\\d+:\\d+$',
                description: 'The record identifier',
                cast: castToRID
            },
            {
                name: '@class',
                description: 'The database class this record belongs to',
                cast: trimString
            },
            {
                name: 'uuid',
                type: 'string',
                mandatory: true,
                nullable: false,
                readOnly: true,
                description: 'Internal identifier for tracking record history',
                cast: castUUID,
                default: uuidV4
            },
            {
                name: 'createdAt',
                type: 'long',
                mandatory: true,
                nullable: false,
                description: 'The timestamp at which the record was created',
                default: timeStampNow
            },
            {
                name: 'deletedAt',
                type: 'long',
                description: 'The timestamp at which the record was deleted',
                nullable: false
            },
            {
                name: 'createdBy',
                type: 'link',
                mandatory: true,
                nullable: false,
                linkedClass: 'User',
                description: 'The user who created the record'
            },
            {
                name: 'deletedBy',
                type: 'link',
                linkedClass: 'User',
                nullable: false,
                description: 'The user who deleted the record'
            },
            {
                name: 'history',
                type: 'link',
                nullable: false,
                description: 'Link to the previous version of this record'
            },
            {name: 'comment', type: 'string'},
            {
                name: 'groupRestrictions',
                type: 'linkset',
                linkedClass: 'UserGroup',
                description: 'user groups allowed to interact with this record'
            }
        ]
    },
    E: {
        expose: EXPOSE_NONE,
        isEdge: true,
        properties: [
            {
                name: '@rid',
                pattern: '^#\\d+:\\d+$',
                description: 'The record identifier',
                cast: castToRID
            },
            {
                name: '@class',
                description: 'The database class this record belongs to',
                cast: trimString
            },
            {
                name: 'uuid',
                type: 'string',
                mandatory: true,
                nullable: false,
                readOnly: true,
                description: 'Internal identifier for tracking record history',
                cast: castUUID,
                default: uuidV4
            },
            {
                name: 'createdAt',
                type: 'long',
                mandatory: true,
                nullable: false,
                description: 'The timestamp at which the record was created',
                default: timeStampNow
            },
            {
                name: 'deletedAt',
                type: 'long',
                description: 'The timestamp at which the record was deleted',
                nullable: false
            },
            {
                name: 'createdBy',
                type: 'link',
                mandatory: true,
                nullable: false,
                linkedClass: 'User',
                description: 'The user who created the record'
            },
            {
                name: 'deletedBy',
                type: 'link',
                linkedClass: 'User',
                nullable: false,
                description: 'The user who deleted the record'
            },
            {
                name: 'history',
                type: 'link',
                nullable: false,
                description: 'Link to the previous version of this record'
            },
            {name: 'comment', type: 'string'},
            {
                name: 'groupRestrictions',
                type: 'linkset',
                linkedClass: 'UserGroup',
                description: 'user groups allowed to interact with this record'
            }
        ],
        identifiers: ['@class', '@rid']
    },
    UserGroup: {
        properties: [
            {
                name: '@rid',
                pattern: '^#\\d+:\\d+$',
                description: 'The record identifier',
                cast: castToRID
            },
            {
                name: '@class',
                description: 'The database class this record belongs to',
                cast: trimString
            },
            {
                name: 'name', mandatory: true, nullable: false, castString
            },
            {
                name: 'uuid',
                type: 'string',
                mandatory: true,
                nullable: false,
                readOnly: true,
                description: 'Internal identifier for tracking record history',
                cast: castUUID,
                default: uuidV4
            },
            {
                name: 'createdAt',
                type: 'long',
                mandatory: true,
                nullable: false,
                description: 'The timestamp at which the record was created',
                default: timeStampNow
            },
            {
                name: 'deletedAt',
                type: 'long',
                description: 'The timestamp at which the record was deleted',
                nullable: false
            },
            {
                name: 'createdBy',
                type: 'link',
                nullable: false,
                description: 'The user who created the record'
            },
            {
                name: 'deletedBy',
                type: 'link',
                nullable: false,
                description: 'The user who deleted the record'
            },
            {
                name: 'history',
                type: 'link',
                nullable: false,
                description: 'Link to the previous version of this record'
            },
            {name: 'permissions', type: 'embedded', linkedClass: 'Permissions'}
        ],
        indices: [
            {
                name: 'ActiveUserGroupName',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['name', 'deletedAt'],
                class: 'UserGroup'
            },
            {
                name: 'ActiveUserGroup',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['uuid', 'deletedAt'],
                class: 'UserGroup'
            }
        ]
    },
    Permissions: {
        expose: EXPOSE_NONE,
        properties: []
    },
    Evidence: {isAbstract: true},
    Biomarker: {isAbstract: true},
    User: {
        properties: [
            {
                name: '@rid',
                pattern: '^#\\d+:\\d+$',
                description: 'The record identifier',
                cast: castToRID
            },
            {
                name: '@class',
                description: 'The database class this record belongs to',
                cast: trimString
            },
            {
                name: 'name',
                mandatory: true,
                nullable: false,
                description: 'The username'
            },
            {
                name: 'groups',
                type: 'linkset',
                linkedClass: 'UserGroup',
                description: 'Groups this user belongs to. Defines permissions for the user'
            },
            {
                name: 'uuid',
                type: 'string',
                mandatory: true,
                nullable: false,
                readOnly: true,
                description: 'Internal identifier for tracking record history',
                cast: castUUID,
                default: uuidV4
            },
            {
                name: 'createdAt',
                type: 'long',
                mandatory: true,
                nullable: false,
                description: 'The timestamp at which the record was created',
                default: timeStampNow
            },
            {name: 'deletedAt', type: 'long', nullable: false},
            {name: 'history', type: 'link', nullable: false},
            {
                name: 'createdBy', type: 'link'
            },
            {
                name: 'deletedBy', type: 'link', nullable: false
            },
            {
                name: 'groupRestrictions',
                type: 'linkset',
                linkedClass: 'UserGroup',
                description: 'user groups allowed to interact with this record'
            }
        ],
        indices: [
            {
                name: 'ActiveUserName',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['name', 'deletedAt'],
                class: 'User'
            },
            {
                name: 'ActiveUser',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['uuid', 'deletedAt'],
                class: 'User'
            }
        ],
        identifiers: ['name', '@rid']
    },
    Source: {
        inherits: ['Evidence', 'V'],
        properties: [
            {
                name: 'name',
                mandatory: true,
                nullable: false,
                description: 'Name of the evidence or source'
            },
            {name: 'version', description: 'The evidence version'},
            {name: 'url', type: 'string'},
            {name: 'description', type: 'string'},
            {
                name: 'usage',
                description: 'Link to the usage/licensing information associated with this evidence'
            }
        ],
        indices: [
            {
                name: 'Source.active',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['name', 'version', 'deletedAt'],
                class: 'Source'
            }
        ],
        identifiers: ['name', '@rid'],
        getPreview: previews.Source
    },
    Ontology: {
        expose: {
            QUERY: true, GET: true
        },
        inherits: ['V', 'Biomarker'],
        properties: [
            {
                name: 'source',
                type: 'link',
                mandatory: true,
                nullable: false,
                linkedClass: 'Source',
                description: 'Link to the source from which this record is defined'
            },
            {
                name: 'sourceId',
                mandatory: true,
                nullable: false,
                nonEmpty: true,
                description: 'The identifier of the record/term in the external source database/system'
            },
            {
                name: 'dependency',
                type: 'link',
                description: 'Mainly for alias records. If this term is defined as a part of another term, this should link to the original term'
            },
            {name: 'name', description: 'Name of the term', nonEmpty: true},
            {
                name: 'sourceIdVersion',
                description: 'The version of the identifier based on the external database/system'
            },
            {name: 'description', type: 'string'},
            {name: 'longName', type: 'string'},
            {
                name: 'subsets',
                type: 'embeddedset',
                linkedType: 'string',
                description: 'A list of names of subsets this term belongs to',
                cast: item => item.trim().toLowerCase()
            },
            {
                name: 'deprecated',
                type: 'boolean',
                default: false,
                nullable: false,
                mandatory: true,
                description: 'True when the term was deprecated by the external source'
            },
            {name: 'url', type: 'string'}
        ],
        isAbstract: true,
        identifiers: [
            '@class',
            'name',
            'sourceId',
            'source.name'
        ],
        getPreview: previews.Ontology
    },
    EvidenceLevel: {inherits: ['Ontology', 'Evidence']},
    ClinicalTrial: {
        inherits: ['Ontology', 'Evidence'],
        properties: [
            {name: 'phase', type: 'string'},
            {name: 'size', type: 'integer'},
            {name: 'startYear', type: 'integer'},
            {name: 'completionYear', type: 'integer'},
            {name: 'country', type: 'string'},
            {name: 'city', type: 'string'}
        ]
    },
    Publication: {
        inherits: ['Ontology', 'Evidence'],
        properties: [
            {
                name: 'journalName',
                description: 'Name of the journal where the article was published'
            },
            {name: 'year', type: 'integer'}
        ],
        getPreview: previews.Publication
    },
    Therapy: {
        inherits: ['Ontology'],
        properties: [
            {name: 'mechanismOfAction', type: 'string'},
            {name: 'molecularFormula', type: 'string'},
            {name: 'iupacName', type: 'string'}
        ]
    },
    Feature: {
        inherits: ['Ontology'],
        properties: [
            {name: 'start', type: 'integer'},
            {name: 'end', type: 'integer'},
            {
                name: 'biotype',
                mandatory: true,
                nullable: false,
                description: 'The biological type of the feature',
                choices: ['gene', 'protein', 'transcript', 'exon', 'chromosome']
            }
        ]
    },
    Position: {
        properties: [
            {
                name: '@class',
                description: 'The database class this record belongs to',
                cast: trimString
            }
        ],
        embedded: true,
        isAbstract: true
    },
    ProteinPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [
            {
                name: 'pos', type: 'integer', min: 1, mandatory: true
            },
            {name: 'refAA', type: 'string', cast: uppercase}
        ],
        identifiers: [
            '@class',
            'pos',
            'refAA'
        ]
    },
    CytobandPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [
            {
                name: 'arm', mandatory: true, nullable: false
            },
            {name: 'majorBand', type: 'integer', min: 1},
            {name: 'minorBand', type: 'integer', min: 1}
        ],
        identifiers: [
            '@class',
            'arm',
            'majorBand',
            'minorBand'
        ]
    },
    GenomicPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [{
            name: 'pos', type: 'integer', min: 1, mandatory: true
        }],
        identifiers: [
            '@class',
            'pos'
        ]
    },
    ExonicPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [{
            name: 'pos', type: 'integer', min: 1, mandatory: true
        }],
        identifiers: [
            '@class',
            'pos'
        ]
    },
    IntronicPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [{
            name: 'pos', type: 'integer', min: 1, mandatory: true
        }],
        identifiers: [
            '@class',
            'pos'
        ]
    },
    CdsPosition: {
        expose: EXPOSE_NONE,
        inherits: ['Position'],
        embedded: true,
        properties: [
            {
                name: 'pos', type: 'integer', min: 1, mandatory: true
            },
            {name: 'offset', type: 'integer'}
        ],
        identifiers: [
            '@class',
            'pos',
            'offset'
        ]
    },
    Variant: {
        expose: {QUERY: true, GET: true},
        inherits: ['V', 'Biomarker'],
        properties: [
            {
                name: 'type',
                type: 'link',
                mandatory: true,
                nullable: false,
                linkedClass: 'Vocabulary'
            },
            {name: 'zygosity', choices: ['heterozygous', 'homozygous']},
            {
                name: 'germline',
                type: 'boolean',
                description: 'Flag to indicate if the variant is germline (vs somatic)'
            }
        ],
        isAbstract: true,
        identifiers: [
            '@class',
            'type.name'
        ]
    },
    PositionalVariant: {
        inherits: ['Variant'],
        properties: [
            {
                name: 'reference1',
                mandatory: true,
                type: 'link',
                linkedClass: 'Feature',
                nullable: false
            },
            {
                name: 'reference2', type: 'link', linkedClass: 'Feature', nullable: false
            },
            {
                name: 'break1Start',
                type: 'embedded',
                linkedClass: 'Position',
                nullable: false,
                mandatory: true
            },
            {name: 'break1End', type: 'embedded', linkedClass: 'Position'},
            {
                name: 'break1Repr',
                type: 'string',
                generated: true,
                default: record => generateBreakRepr(record.break1Start, record.break1End),
                cast: string => `${string.slice(0, 2)}${string.slice(2).toUpperCase()}`
            },
            {name: 'break2Start', type: 'embedded', linkedClass: 'Position'},
            {name: 'break2End', type: 'embedded', linkedClass: 'Position'},
            {
                name: 'break2Repr',
                type: 'string',
                generated: true,
                default: record => generateBreakRepr(record.break2Start, record.break2End),
                cast: string => `${string.slice(0, 2)}${string.slice(2).toUpperCase()}`
            },
            {name: 'refSeq', type: 'string', cast: uppercase},
            {name: 'untemplatedSeq', type: 'string', cast: uppercase},
            {name: 'untemplatedSeqSize', type: 'integer'}, // for when we know the number of bases inserted but not what they are
            {name: 'truncation', type: 'integer'},
            {
                name: 'assembly',
                type: 'string',
                choices: ['Hg18', 'Hg19/GRCh37', 'GrCh38'],
                description: 'Flag which is optionally used for genomic variants that are not linked to a fixed assembly reference'
            } // hg19, GRhg38
        ],
        indices: [
            {
                name: 'PositionalVariant.active',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: [
                    'break1Repr',
                    'break2Repr',
                    'deletedAt',
                    'germline',
                    'refSeq',
                    'reference1',
                    'reference2',
                    'type',
                    'untemplatedSeq',
                    'untemplatedSeqSize',
                    'zygosity',
                    'truncation',
                    'assembly'
                ],
                class: 'PositionalVariant'
            },
            {
                name: 'PositionalVariant.reference1',
                type: 'NOTUNIQUE_HASH_INDEX',
                metadata: {ignoreNullValues: true},
                properties: [
                    'reference1'
                ],
                class: 'PositionalVariant'
            },
            {
                name: 'PositionalVariant.reference2',
                type: 'NOTUNIQUE_HASH_INDEX',
                metadata: {ignoreNullValues: true},
                properties: [
                    'reference2'
                ],
                class: 'PositionalVariant'
            }
        ],
        identifiers: [
            'type.name',
            'reference1.name',
            'reference2.name',
            'preview'
        ],
        getPreview: previews.PositionalVariant
    },
    CategoryVariant: {
        inherits: ['Variant'],
        properties: [
            {
                name: 'reference1',
                mandatory: true,
                type: 'link',
                linkedClass: 'Ontology',
                nullable: false
            },
            {
                name: 'reference2', type: 'link', linkedClass: 'Ontology', nullable: false
            }
        ],
        indices: [
            {
                name: 'CategoryVariant.active',
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: [
                    'deletedAt',
                    'germline',
                    'reference1',
                    'reference2',
                    'type',
                    'zygosity'
                ],
                class: 'CategoryVariant'
            },
            {
                name: 'CategoryVariant.reference1',
                type: 'NOTUNIQUE_HASH_INDEX',
                metadata: {ignoreNullValues: true},
                properties: [
                    'reference1'
                ],
                class: 'CategoryVariant'
            },
            {
                name: 'CategoryVariant.reference2',
                type: 'NOTUNIQUE_HASH_INDEX',
                metadata: {ignoreNullValues: true},
                properties: [
                    'reference2'
                ],
                class: 'CategoryVariant'
            }
        ],
        identifiers: [
            'type.name',
            'reference1.name',
            'reference2.name'
        ],
        getPreview: previews.CategoryVariant
    },
    Statement: {
        expose: EXPOSE_ALL,
        inherits: ['V'],
        properties: [
            {
                name: 'relevance',
                type: 'link',
                linkedClass: 'Vocabulary',
                mandatory: true,
                nullable: false
            },
            {
                name: 'appliesTo',
                type: 'link',
                linkedClass: 'Ontology',
                mandatory: true,
                nullable: true
            },
            {name: 'description', type: 'string'},
            {
                name: 'reviewStatus',
                type: 'string',
                choices: ['pending', 'not required', 'passed', 'failed']
            },
            {name: 'reviewComment', type: 'string'},
            {
                name: 'sourceId',
                description: 'If the statement is imported from an external source, this is used to track the statement'
            },
            {
                name: 'source',
                description: 'If the statement is imported from an external source, it is linked here',
                linkedClass: 'Source',
                type: 'link'
            }
        ],
        identifiers: [
            'appliesTo.name',
            'relevance.name',
            'source.name',
            'reviewStatus'
        ],
        getPreview: previews.Statement

    },
    AnatomicalEntity: {inherits: ['Ontology']},
    Disease: {inherits: ['Ontology']},
    Pathway: {inherits: ['Ontology']},
    Signature: {inherits: ['Ontology']},
    Vocabulary: {inherits: ['Ontology']},
    CatalogueVariant: {inherits: ['Ontology']}
};


// initialize the schema definition
((schema) => {
    // Add the indicies to the ontology subclasses
    for (const [name, defn] of Object.entries(schema)) {
        if (!defn.inherits || !defn.inherits.includes('Ontology')) {
            continue;
        }
        if (schema[name].indices === undefined) {
            schema[name].indices = [];
        }
        schema[name].indices.push(...[
            {
                name: `${name}.active`,
                type: 'unique',
                metadata: {ignoreNullValues: false},
                properties: ['source', 'sourceId', 'name', 'deletedAt', 'sourceIdVersion'],
                class: name
            },
            {
                name: `${name}.name`,
                type: 'NOTUNIQUE_HASH_INDEX',
                properties: ['name'],
                class: name
            },
            {
                name: `${name}.sourceId`,
                type: 'NOTUNIQUE_HASH_INDEX',
                properties: ['sourceId'],
                class: name
            },
            {
                name: `${name}.nameFull`,
                type: 'FULLTEXT_HASH_INDEX',
                properties: ['name'],
                class: name,
                metadata: {separatorChars: INDEX_SEP_CHARS}
            },
            {
                name: `${name}.sourceIdFull`,
                type: 'FULLTEXT_HASH_INDEX',
                properties: ['sourceId'],
                class: name,
                metadata: {separatorChars: INDEX_SEP_CHARS}
            }
        ]);
    }

    // Add the edge classes
    for (const name of [
        'AliasOf',
        'Cites',
        'DeprecatedBy',
        'ElementOf',
        'Implies',
        'Infers',
        'OppositeOf',
        'SubClassOf',
        'SupportedBy',
        'TargetOf',
        'GeneralizationOf'
    ]) {
        const sourceProp = {name: 'source', type: 'link', linkedClass: 'Source'};
        if (!['SupportedBy', 'Implies'].includes(name)) {
            sourceProp.mandatory = true;
            sourceProp.nullable = false;
        }
        let reverseName;
        if (name.endsWith('Of')) {
            reverseName = `Has${name.slice(0, name.length - 2)}`;
        } else if (name === 'SupportedBy') {
            reverseName = 'Supports';
        } else if (name.endsWith('By')) {
            reverseName = `${name.slice(0, name.length - 3)}s`;
        } else if (name === 'Infers') {
            reverseName = 'InferredBy';
        } else {
            reverseName = `${name.slice(0, name.length - 1)}dBy`;
        }
        schema[name] = {
            isEdge: true,
            reverseName,
            inherits: ['E'],
            properties: [
                {name: 'in', type: 'link', description: 'The record ID of the vertex the edge goes into, the target/destination vertex'},
                {name: 'out', type: 'link', description: 'The record ID of the vertex the edge comes from, the source vertex'},
                sourceProp
            ],
            indices: [ // add index on the class so it doesn't apply across classes
                {
                    name: `${name}.restrictMultiplicity`,
                    type: 'unique',
                    metadata: {ignoreNullValues: false},
                    properties: ['deletedAt', 'in', 'out', 'source'],
                    class: name
                }
            ]
        };
        if (name === 'SupportedBy') {
            schema[name].properties.push(...[
                {name: 'level', type: 'link', linkedClass: 'EvidenceLevel'},
                {name: 'summary', description: 'Generally a quote from the supporting source which describes the pertinent details with resect to the statement it supports'}
            ]);
        }
    }

    // Set the name to match the key
    // initialize the models
    for (const name of Object.keys(schema)) {
        if (name !== 'Permissions' && !schema[name].embedded) {
            schema.Permissions.properties.push({
                min: PERMISSIONS.NONE, max: PERMISSIONS.ALL, type: 'integer', nullable: false, readOnly: false, name
            });
        }
    }
    const models = {};
    for (const [name, model] of Object.entries(schema)) {
        model.name = name;
        const properties = {};
        for (const prop of model.properties || []) {
            properties[prop.name] = new Property(prop);
        }
        models[name] = new ClassModel(Object.assign(
            {properties},
            omit(model, ['inherits', 'properties'])
        ));
    }
    // link the inherited models and linked models
    for (const model of Object.values(models)) {
        const defn = schema[model.name];
        for (const parent of defn.inherits || []) {
            if (models[parent] === undefined) {
                throw new Error(`Schema definition error. Expected model ${parent} is not defined`);
            }
            models[model.name]._inherits.push(models[parent]);
            models[parent].subclasses.push(models[model.name]);
        }
        for (const prop of Object.values(model._properties)) {
            if (prop.linkedClass) {
                if (models[prop.linkedClass] === undefined) {
                    throw new Error(`Schema definition error. Expected model ${prop.linkedClass} is not defined`);
                }
                prop.linkedClass = models[prop.linkedClass];
            }
        }
    }

    // Apply default identifiers and getPreview functions to root class models.
    for (const model of Object.values(models)) {
        if (!model.inherits || model.inherits.length === 0) {
            if (!model.identifiers) {
                model.identifiers = DEFAULT_IDENTIFIERS;
            }
            if (!model.getPreview) {
                model.getPreview = defaultPreview(model);
            }
        }
    }

    // Inherit identifiers and getPreview functions from parent classes.
    for (const model of Object.values(models)) {
        if (!model.identifiers) {
            model.identifiers = inheritField(model, 'identifiers');
        }
        if (!model.getPreview) {
            model.getPreview = inheritField(model, 'getPreview');
        }
    }
    Object.assign(SCHEMA_DEFN, models);
})(SCHEMA_DEFN);

module.exports = SCHEMA_DEFN;
