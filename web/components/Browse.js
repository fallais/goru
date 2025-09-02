import React from 'react';
import { Box, Grid } from '@mui/material';
import {
  DirectoryBreadcrumbs,
  FileList,
  FileInfoModal,
  ActionsPanel,
  ResultsPanel,
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
    handleLookup,
    handleEditLookup,
    handleApply,
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
      
      <ActionsPanel
        loading={loading}
        currentPath={currentPath}
        onPlan={handleLookup}
        onApply={handleApply}
        planExists={plan && plan.changes && plan.changes.length > 0}
      />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FileList
            files={files}
            plan={plan}
            loading={loading}
            currentPath={currentPath}
            onFileClick={handleFileClick}
            onDirectoryClick={handleDirectoryClick}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ResultsPanel
            plan={plan}
            loading={loading}
          />
        </Grid>
      </Grid>
      
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
