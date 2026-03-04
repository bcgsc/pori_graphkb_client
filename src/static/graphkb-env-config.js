window._env_ = {
  KEYCLOAK_CLIENT_ID: import.meta.env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_ROLE: import.meta.env.KEYCLOAK_ROLE,
  KEYCLOAK_REALM: import.meta.env.KEYCLOAK_REALM,
  KEYCLOAK_URL: import.meta.env.KEYCLOAK_URL,
  API_BASE_URL: import.meta.env.API_BASE_URL,
  CONTACT_EMAIL: import.meta.env.CONTACT_EMAIL,
  CONTACT_TICKET_URL: import.meta.env.CONTACT_TICKET_URL,
  PUBLIC_PATH: import.meta.env.PUBLIC_PATH,
  IS_DEMO: import.meta.env.IS_DEMO !== 'false',
};
