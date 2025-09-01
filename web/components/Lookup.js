import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Grid,
  CircularProgress,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Alert,
  Stack,
} from '@mui/material';
import {
  Folder,
  VideoFile,
  Search,
  Movie,
  Tv,
  Info,
  Refresh,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';
import { useApiCall } from '../hooks/useApiCall';
import { useNotification } from '../contexts/NotificationContext';
import { useDirectory } from '../contexts/DirectoryContext';

function Lookup() {
  const apiCall = useApiCall();
  const { showError, showSuccess } = useNotification();
  const { selectedDirectory } = useDirectory();
  
  // State for files panel
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // State for TMDB search panel
  const [searchQuery, setSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [loadingTmdb, setLoadingTmdb] = useState(false);
  const [mediaType, setMediaType] = useState('movie');
  const [selectedTmdbItem, setSelectedTmdbItem] = useState(null);
  
  // State for proposed changes
  const [proposedChanges, setProposedChanges] = useState(null);
  
  // Load files from selected directory when it changes
  useEffect(() => {
    if (selectedDirectory) {
      loadDirectory(selectedDirectory.path);
    } else {
      setFiles([]);
    }
  }, [selectedDirectory]);

  const loadDirectory = async (path) => {
    setLoadingFiles(true);
    
    const result = await apiCall.get('/api/directory', {
      params: { path: path },
      errorPrefix: 'Failed to load directory'
    });
    
    if (result.success) {
      setFiles(result.data.data.files || []);
    }
    
    setLoadingFiles(false);
  };

  const searchTMDB = async () => {
    if (!searchQuery.trim()) {
      showError('Please enter a search query');
      return;
    }

    setLoadingTmdb(true);
    
    const result = await apiCall.post('/api/tmdb/search', {
      query: searchQuery,
      mediaType: mediaType
    }, {
      errorPrefix: 'Failed to search TMDB'
    });
    
    if (result.success) {
      setTmdbResults(result.data.data.results || result.data.results || []);
    } else {
      // Show placeholder results if API is not yet fully implemented
      setTmdbResults([
        {
          id: 1,
          title: searchQuery + ' (Sample Result)',
          name: searchQuery + ' (Sample TV Show)',
          overview: 'This is a placeholder result. The TMDB API integration may need to be implemented on the backend.',
          release_date: '2023-01-01',
          first_air_date: '2023-01-01',
          poster_path: null
        }
      ]);
    }
    
    setLoadingTmdb(false);
  };

  const handleFileSelect = (file) => {
    // Only handle video files, not directories (since we don't navigate anymore)
    if (file.type === 'file') {
      // For video files, select the file and auto-populate search with filename
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      // Clean up the filename for better search results
      const cleanName = nameWithoutExt
        .replace(/[\[\]()]/g, ' ') // Remove brackets and parentheses
        .replace(/\d{4}/g, '') // Remove years
        .replace(/\b(1080p|720p|480p|2160p|4K|HD|HDR|x264|x265|HEVC|BluRay|WEB|WEBRip|DVDRip)\b/gi, '') // Remove quality indicators
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      setSearchQuery(cleanName);
    }
  };

  const handleTMDBSelect = (tmdbItem) => {
    setSelectedTmdbItem(tmdbItem);
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

  const applyProposedChanges = async () => {
    if (!proposedChanges) {
      showError('No proposed changes to apply');
      return;
    }

    try {
      // Create a plan similar to the Browse component
      const plan = {
        changes: [{
          path: proposedChanges.originalFile.path,
          oldName: proposedChanges.originalName,
          newName: proposedChanges.proposedName,
          action: 126 // rename action code
        }]
      };

      const result = await apiCall.post('/api/apply', {
        plan: plan,
      }, {
        errorPrefix: 'Failed to apply changes',
        successMessage: 'File renamed successfully!',
        showSuccessNotification: true
      });

      if (result.success) {
        // Refresh the directory to show the updated file names
        if (selectedDirectory) {
          await loadDirectory(selectedDirectory.path);
        }
        setProposedChanges(null);
        setSelectedFile(null);
        setSelectedTmdbItem(null);
      }
    } catch (error) {
      showError('Failed to apply changes');
    }
  };

  const filteredFiles = files

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advanced Lookup
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Use this tool for complex lookups that require more detailed search capabilities. Select a directory from the Browse tab to get started.
      </Typography>

      {!selectedDirectory && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a directory from the Browse component first to use the Lookup functionality.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Selections and Proposed Changes */}
        {(selectedFile || selectedTmdbItem || proposedChanges) && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Selection
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                {selectedFile && (
                  <Chip 
                    icon={<VideoFile />} 
                    label={`File: ${selectedFile.name}`} 
                    color="primary" 
                    variant="outlined"
                    onDelete={() => {
                      setSelectedFile(null);
                      setProposedChanges(null);
                    }}
                  />
                )}
                {selectedTmdbItem && (
                  <Chip 
                    icon={mediaType === 'movie' ? <Movie /> : <Tv />} 
                    label={`TMDB: ${selectedTmdbItem.title || selectedTmdbItem.name}`} 
                    color="secondary" 
                    variant="outlined"
                    onDelete={() => {
                      setSelectedTmdbItem(null);
                      setProposedChanges(null);
                    }}
                  />
                )}
              </Stack>
              
              {proposedChanges && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Proposed Changes:</Typography>
                    <Typography variant="body2">
                      <strong>From:</strong> {proposedChanges.originalName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>To:</strong> {proposedChanges.proposedName}
                    </Typography>
                  </Alert>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<CheckCircle />}
                    onClick={applyProposedChanges}
                  >
                    Apply Changes
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Files Panel */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Folder sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {selectedDirectory ? `Files from: ${selectedDirectory.name}` : 'No directory selected'}
              </Typography>
              {selectedDirectory && (
                <IconButton 
                  onClick={() => loadDirectory(selectedDirectory.path)} 
                  disabled={loadingFiles}
                  title="Refresh directory"
                >
                  <Refresh />
                </IconButton>
              )}
            </Box>
            
            {selectedDirectory && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Path: {selectedDirectory.path}
              </Typography>
            )}

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {!selectedDirectory ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="text.secondary">
                    Select a directory from Browse to see files here
                  </Typography>
                </Box>
              ) : loadingFiles ? (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress />
                </Box>
              ) : filteredFiles.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="text.secondary">
                    No video files found in selected directory
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {filteredFiles.map((file, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton 
                        onClick={() => handleFileSelect(file)}
                        selected={selectedFile && selectedFile.path === file.path}
                      >
                        <ListItemIcon>
                          <VideoFile />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name}
                          secondary={`Size: ${file.size || 'Unknown'}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* TMDB Search Panel */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Movie sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                TMDB Search Results
              </Typography>
            </Box>

            {/* Search Controls */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search for movies or TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTMDB()}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value)}
                    >
                      <MenuItem value="movie">Movie</MenuItem>
                      <MenuItem value="tv">TV Show</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={searchTMDB}
                    disabled={loadingTmdb}
                    startIcon={<Search />}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Results */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loadingTmdb ? (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {tmdbResults.map((item, index) => (
                    <ListItem key={item.id || index} disablePadding sx={{ mb: 1 }}>
                      <Card 
                        sx={{ 
                          width: '100%',
                          ...(selectedTmdbItem && selectedTmdbItem.id === item.id && {
                            border: '2px solid',
                            borderColor: 'primary.main'
                          })
                        }} 
                        variant="outlined"
                      >
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {item.title || item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.release_date || item.first_air_date}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {item.overview && item.overview.length > 150
                              ? `${item.overview.substring(0, 150)}...`
                              : item.overview || 'No description available.'}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleTMDBSelect(item)}
                            startIcon={selectedTmdbItem && selectedTmdbItem.id === item.id ? <CheckCircle /> : <Info />}
                            variant={selectedTmdbItem && selectedTmdbItem.id === item.id ? "contained" : "outlined"}
                          >
                            {selectedTmdbItem && selectedTmdbItem.id === item.id ? "Selected" : "Use This"}
                          </Button>
                        </CardActions>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Lookup;
