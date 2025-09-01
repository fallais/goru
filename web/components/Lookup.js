import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { useNotification } from '../contexts/NotificationContext';
import { useDirectory } from '../contexts/DirectoryContext';
import { useTMDBSearch } from '../hooks/useTMDBSearch';
import { useFileOperations } from '../hooks/useFileOperations';
import TMDBSearch from './lookup/TMDBSearch';
import FileExplorer from './lookup/FileExplorer';
import ProposedChanges from './lookup/ProposedChanges';

function Lookup() {
  const { showSuccess } = useNotification();
  const { selectedDirectory } = useDirectory();
  
  // TMDB Search state
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [tvSearchQuery, setTvSearchQuery] = useState('');
  const [tvSearchYear, setTvSearchYear] = useState('');
  const [tvSearchSeason, setTvSearchSeason] = useState('');
  const [movieSearchYear, setMovieSearchYear] = useState('');
  const [tmdbTab] = useState(0); // Track current tab for display purposes
  
  // File operations hook
  const {
    files,
    loadingFiles,
    selectedFile,
    loadDirectory,
    selectFile,
    clearFileSelection,
    applyChanges,
  } = useFileOperations();
  
  // TMDB search hook
  const {
    tmdbResults,
    loadingTmdb,
    selectedTmdbItem,
    searchTMDB,
    selectTmdbItem,
    clearTmdbSelection,
  } = useTMDBSearch();
  
  // State for proposed changes
  const [proposedChanges, setProposedChanges] = useState(null);
  
  // Load files from selected directory when it changes
  useEffect(() => {
    if (selectedDirectory) {
      loadDirectory(selectedDirectory.path);
    }
  }, [selectedDirectory]);

  const handleFileSelect = (file) => {
    const cleanName = selectFile(file);
    if (cleanName) {
      // Set search query for both tabs
      setMovieSearchQuery(cleanName);
      setTvSearchQuery(cleanName);
    }
  };

  const handleTMDBSelect = (tmdbItem) => {
    selectTmdbItem(tmdbItem);
    showSuccess(`Selected: ${tmdbItem.title || tmdbItem.name}`);
    
    // If we have both a file and TMDB item selected, generate proposed changes
    if (selectedFile && tmdbItem) {
      generateProposedChanges(selectedFile, tmdbItem);
    }
  };

  const generateProposedChanges = (file, tmdbItem) => {
    // Generate a proposed new filename based on TMDB data
    const title = tmdbItem.title || tmdbItem.name;
    const year = tmdbItem.release_date ? new Date(tmdbItem.release_date).getFullYear() : 
                 tmdbItem.first_air_date ? new Date(tmdbItem.first_air_date).getFullYear() : '';
    
    // Get file extension
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    
    // Create proposed filename
    const proposedName = year ? `${title} (${year})${extension}` : `${title}${extension}`;
    
    setProposedChanges({
      originalFile: file,
      tmdbData: tmdbItem,
      proposedName: proposedName,
      originalName: file.name
    });
  };

  const handleApplyChanges = async () => {
    const result = await applyChanges(proposedChanges);
    
    if (result.success) {
      // Refresh the directory to show the updated file names
      if (selectedDirectory) {
        await loadDirectory(selectedDirectory.path);
      }
      setProposedChanges(null);
      clearFileSelection();
      clearTmdbSelection();
    }
  };

  const handleClearFile = () => {
    clearFileSelection();
    setProposedChanges(null);
  };

  const handleClearTmdb = () => {
    clearTmdbSelection();
    setProposedChanges(null);
  };

  const handleRefreshDirectory = () => {
    if (selectedDirectory) {
      loadDirectory(selectedDirectory.path);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Lookup
      </Typography>

      {!selectedDirectory && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a directory from the Browse component first to use the Lookup functionality.
        </Alert>
      )}

      {/* TMDB Search Panel */}
      <TMDBSearch
        movieQuery={movieSearchQuery}
        setMovieQuery={setMovieSearchQuery}
        movieYear={movieSearchYear}
        setMovieYear={setMovieSearchYear}
        tvQuery={tvSearchQuery}
        setTvQuery={setTvSearchQuery}
        tvYear={tvSearchYear}
        setTvYear={setTvSearchYear}
        tvSeason={tvSearchSeason}
        setTvSeason={setTvSearchSeason}
        tmdbResults={tmdbResults}
        loadingTmdb={loadingTmdb}
        selectedTmdbItem={selectedTmdbItem}
        onSearch={searchTMDB}
        onSelectItem={handleTMDBSelect}
      />

      <Grid container spacing={3}>
        {/* Current Selections and Proposed Changes */}
        <Grid item xs={12}>
          <ProposedChanges
            selectedFile={selectedFile}
            selectedTmdbItem={selectedTmdbItem}
            proposedChanges={proposedChanges}
            tmdbTab={tmdbTab}
            onClearFile={handleClearFile}
            onClearTmdb={handleClearTmdb}
            onApplyChanges={handleApplyChanges}
          />
        </Grid>

        {/* Files Panel */}
        <Grid item xs={12}>
          <FileExplorer
            selectedDirectory={selectedDirectory}
            files={files}
            loadingFiles={loadingFiles}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onRefresh={handleRefreshDirectory}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Lookup;
