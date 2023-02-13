import React from 'react';

interface ActiveLinkContextState {
  activeLink: string;
  setActiveLink: (route: string) => void;
}

const ActiveLinkContext = React.createContext<ActiveLinkContextState>({
  activeLink: '',
  setActiveLink: () => {},
});

export default ActiveLinkContext;
