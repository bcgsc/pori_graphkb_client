import React from 'react';


const ActiveLinkContext = React.createContext({
  activeLink: '',
  setActiveLink: () => {},
});


export default ActiveLinkContext;
