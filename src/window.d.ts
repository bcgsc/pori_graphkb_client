declare global {
  interface Window {
    _env_: {
      KEYCLOAK_REALM: string;
      KEYCLOAK_CLIENT_ID: string;
      KEYCLOAK_URL: string;
      KEYCLOAK_ROLE: string;
      CONTACT_EMAIL: string;
      CONTACT_TICKET_URL: string;
      IS_DEMO: string;
      API_BASE_URL: string;
      PUBLIC_PATH: string;
    }
  }
}

export {};
