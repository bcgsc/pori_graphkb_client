const DEFAULT_URL = process.env.NODE_ENV === 'local'
  ? 'http://localhost:8080/api'
  : 'http://kbapi01:8080/api';


export default {
  DISABLE_AUTH: (process.env.NODE_ENV === 'local'
    ? true
    : process.env.DISABLE_AUTH === '1'
  ),
  API_BASE_URL: process.env.API_BASE_URL || DEFAULT_URL,
  KEYS: {
    KB_TOKEN: 'kbToken',
    KEYCLOAK_TOKEN: 'kcToken',
    GRAPH_OBJECTS: 'graphObjects',
  },
  KEYCLOAK: {
    REALM: process.env.KEYCLOAK_REALM || 'TestKB', // TODO: Migrate over to production keycloak realm (will probably be something like "GSC")s
    CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'GraphKB',
    URL: process.env.KEYCLOAK_URL || 'http://ga4ghdev01.bcgsc.ca:8080/auth',
    GRAPHKB_ROLE: process.env.KEYCLOAK_ROLE || 'GraphKB',
  },
  FEEDBACK_EMAIL: 'graphkb@bcgsc.ca',
  FEEDBACK_HIPCHAT: '@IsaacBeckie',
  JIRA_LINK: 'https://www.bcgsc.ca/jira/projects/KBDEV',
  GRAPH_PROPERTIES: {
    ARROW_WIDTH: 3,
    ARROW_LENGTH: 4,
    NODE_INIT_RADIUS: 100,
    NODE_RADIUS: 16,
    DETAILS_RING_RADIUS: 56,
    FONT_SIZE: 7,
    LABEL_V_MARGIN: 4,
    ICON_DIMS: 24,
    ZOOM_BOUNDS: [
      0.2,
      10,
    ],
  },
  GRAPH_DEFAULTS: {
    LINK_STRENGTH: 0.02,
    CHARGE_STRENGTH: 100,
    CHARGE_MAX: 500,
    COLLISION_RADIUS: 16,
    DEFAULT_NODE_COLOR: '#26328C',
    PALLETE_SIZE: 20,
    NODE_COLORS: [
      '#72b14d',
      '#d14a64',
      '#d1972c',
      '#48c69e',
      '#ca58ae',
      '#a76ed1',
      '#acb839',
      '#5e74d8',
      '#4a3689',
      '#aba94e',
      '#7b3077',
      '#4e9d54',
      '#ce89d3',
      '#c67b33',
      '#628ed6',
      '#bb4834',
      '#8a702c',
      '#bd4d7f',
      '#d07b56',
      '#9d3d43',
    ],
    LINK_COLORS: [
      '#638bcf',
      '#cc4ccf',
      '#c3ca48',
      '#7ad58c',
      '#d5ad56',
      '#c28edf',
      '#d63f57',
      '#5ccdc2',
      '#6548c7',
      '#d73e8f',
      '#4b7e39',
      '#893a8a',
      '#876f2e',
      '#d178a7',
      '#873620',
      '#dc5c2a',
      '#77d54b',
      '#7b2c4a',
      '#3f2e72',
      '#d8806c',
    ],
  },
  TABLE_PROPERTIES: {
    ROWS_PER_PAGE: [
      25,
      50,
      100,
    ],
    TSV_FILENAME: 'download.tsv',
  },
  DEFAULT_NEIGHBORS: 3,
  ONTOLOGY_QUERY_PARAMS: [
    {
      name: 'neighbors',
      type: 'integer',
    },
    {
      name: 'limit',
      type: 'integer',
    },
    {
      name: 'skip',
      type: 'integer',
    },
    {
      name: 'fuzzyMatch',
      type: 'integer',
    },
    {
      name: 'ancestors',
      type: 'string',
    },
    {
      name: 'descendants',
      type: 'string',
    },
    {
      name: 'activeOnly',
      type: 'boolean',
      default: true,
    },
  ],
  DESCRIPTIONS: {
    GRAPH_ADVANCED: [
      {
        title: 'Link Strength',
        description: 'Defines the strength of the pulling force that links exert between nodes',
      },
      {
        title: 'Charge Strength',
        description: 'Defines the strength of the repulsive force that nodes exert on other nodes.',
      },
      {
        title: 'Collision Radius',
        description: 'Defines the minimum distance between nodes.',
      },
      {
        title: 'Auto Space Nodes Option',
        description: 'Spaces nodes based on label length, in order to help label readability.',
      },
      {
        title: 'Max Charge Distance',
        description: 'Defines the maximum distance at which the charge force will be applied to the nodes.',
      },
    ],
    GRAPH_MAIN: [
      {
        title: 'Node Labels',
        description: 'Choose which property to label nodes by. Determined based on the current displayed nodes.',
      },
      {
        title: 'Node Colors',
        description: 'Choose which node properties to color nodes based on. Eligible properties are those with 20 or fewer different unique values throughout the displayed nodes.',
      },
      {
        title: 'Edge Labels',
        description: 'Choose which property to display on the edges in the graph.',
      },
      {
        title: 'Edge Colors',
        description: 'Choose which edge properties to color edges based on. Eligible properties are those with 20 or fewer different unique values throughout the displayed edges.',
      },
    ],
  },
  NOTIFICATIONS: {
    GRAPH_UNIQUE_LIMIT: 'Too many subgroups, choose new coloring property.',
  },
  PERMISSIONS: [
    'DELETE',
    'UPDATE',
    'READ',
    'CREATE',
  ],
};
