declare global {
  interface Window {
    _env_: {
      KEYCLOAK_REALM: string;
      KEYCLOAK_CLIENT_ID: string;
      KEYCLOAK_URL: string;
      KEYCLOAK_ROLE: string;
    }
  }
}

export {};
