window._env_ = {
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || "GraphKB",
  KEYCLOAK_ROLE: process.env.KEYCLOAK_ROLE || "GraphKB",
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || "GSC",
  KEYCLOAK_URL: process.env.KEYCLOAK_URL || "https://keycloakdev.bcgsc.ca/auth",
  API_BASE_URL: process.env.API_BASE_URL || "https://graphkbdev-api.bcgsc.ca",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || "graphkb@bcgsc.ca",
  CONTACT_TICKET_URL: process.env.CONTACT_TICKET_URL || "https://www.bcgsc.ca/jira/projects/KBDEV",
};
