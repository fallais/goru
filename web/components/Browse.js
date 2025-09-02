import React from 'react';
import { Box } from '@mui/material';
import {
  DirectoryBreadcrumbs,
  FileList,
  FileInfoModal,
} from './browse/index';
import { useBrowseLogic } from '../hooks/useBrowseLogic';

function Browse({ searchPath }) {
  const {
    // State
    currentPath,
    files,
    plan,
    loading,
    modalOpen,
    selectedFile,
    
    // Handlers
    loadCurrentDirectory,
    loadDirectory,
    handleDirectoryClick,
    handleParentDirectory,
    handleEditLookup,
    handleFileClick,
    handleCloseModal,
    handleRefresh,
  } = useBrowseLogic();

  return (
    <Box>
      <DirectoryBreadcrumbs
        currentPath={currentPath}
        loading={loading}
        onLoadCurrentDirectory={loadCurrentDirectory}
        onLoadDirectory={loadDirectory}
        onParentDirectory={handleParentDirectory}
        onRefresh={handleRefresh}
      />
      
      <FileList
        files={files}
        plan={plan}
        loading={loading}
        currentPath={currentPath}
        onFileClick={handleFileClick}
        onDirectoryClick={handleDirectoryClick}
        onEditLookup={handleEditLookup}
      />
      
      <FileInfoModal
        open={modalOpen}
        file={selectedFile}
        plan={plan}
        onClose={handleCloseModal}
      />
    </Box>
  );
}

export default Browse;
