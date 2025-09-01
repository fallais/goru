import React, { createContext, useContext, useState } from 'react';

const DirectoryContext = createContext();

export const useDirectory = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
};

export const DirectoryProvider = ({ children }) => {
  const [selectedDirectory, setSelectedDirectory] = useState(null);

  const selectDirectory = (directoryData) => {
    setSelectedDirectory(directoryData);
  };

  const clearDirectory = () => {
    setSelectedDirectory(null);
  };

  return (
    <DirectoryContext.Provider value={{
      selectedDirectory,
      selectDirectory,
      clearDirectory,
    }}>
      {children}
    </DirectoryContext.Provider>
  );
};
