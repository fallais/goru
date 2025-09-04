
import { Box, Grid2 } from '@mui/material';
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
    highlightedFilePath,
    
    // Handlers
    loadCurrentDirectory,
    loadDirectory,
    handleDirectoryClick,
    handleParentDirectory,
    handleLookup,
    handleApply,
    handleFileClick,
    handleCloseModal,
    handleRefresh,
    handleFileHover,
    handleFileHoverLeave,
    handlePlanResultHover,
    handlePlanResultHoverLeave,
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
      
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <FileList
            files={files}
            plan={plan}
            loading={loading}
            currentPath={currentPath}
            highlightedFilePath={highlightedFilePath}
            onFileClick={handleFileClick}
            onDirectoryClick={handleDirectoryClick}
            onFileHover={handleFileHover}
            onFileHoverLeave={handleFileHoverLeave}
          />
        </Grid2>
        
        <Grid2 size={{ xs: 12, md: 6 }}>
          <ResultsPanel
            plan={plan}
            loading={loading}
            highlightedFilePath={highlightedFilePath}
            onPlanResultHover={handlePlanResultHover}
            onPlanResultHoverLeave={handlePlanResultHoverLeave}
          />
        </Grid2>
      </Grid2>
      
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
