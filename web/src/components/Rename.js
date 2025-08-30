import React, { useState } from 'react';
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
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  VideoFile,
  Search,
  PlayArrow,
  Error,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import axios from 'axios';

function Rename() {
  const [directoryPath, setDirectoryPath] = useState('');
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaType, setMediaType] = useState('auto');
  const [provider, setProvider] = useState('tmdb');
  const [recursive, setRecursive] = useState(true);

  // Map action numbers to labels and chip colors
  const getActionInfo = (action) => {
    switch (action) {
      case 126: // rename
        return { label: 'Rename', color: 'warning' };
      case 200: // already correct (example)
        return { label: 'Already correct', color: 'success' };
      case 300: // skip (example)
        return { label: 'Skip', color: 'error' };
      default:
        return { label: 'Action', color: 'primary' };
    }
  };

  const handleSearch = async () => {
    if (!directoryPath.trim()) {
      setError('Please enter a directory path');
      return;
    }

    setLoading(true);
    setError('');
    setFiles([]);

    try {
      const response = await axios.get('/api/directory', {
        params: { path: directoryPath }
      });

      console.log('Directory API response:', response.data);
      setFiles(response.data.files || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to scan directory');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!directoryPath.trim()) {
      setError('Please enter a directory path');
      return;
    }

    setLoading(true);
    setError('');
    setPlan(null);

    try {
      const response = await axios.post('/api/lookup', {
        directory: directoryPath,
        type: mediaType,
        provider: provider,
        recursive: recursive,
      });

      console.log('Lookup API response:', response.data);
      setPlan(response.data.plan);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to lookup media information');
    } finally {
      setLoading(false);
    }
  };

  const renderFileList = () => {
    if (files.length === 0) return null;

    const videoFiles = files.filter(file => 
      !file.isDir && (
        file.name.endsWith('.mp4') ||
        file.name.endsWith('.mkv') ||
        file.name.endsWith('.avi') ||
        file.name.endsWith('.mov') ||
        file.name.endsWith('.wmv') ||
        file.name.endsWith('.flv') ||
        file.name.endsWith('.webm') ||
        file.name.endsWith('.m4v') ||
        file.name.endsWith('.mpg') ||
        file.name.endsWith('.mpeg') ||
        file.name.endsWith('.3gp') ||
        file.name.endsWith('.ogv')
      )
    );

    // Create a map of changes by file path for quick lookup
    const changesByPath = {};
    if (plan && plan.changes) {
      plan.changes.forEach(change => {
        changesByPath[change.before.path] = change;
      });
    }

    // If we have a plan, show video files with changes first, then other files
    let filesToShow;
    if (plan && plan.changes && plan.changes.length > 0) {
      const videoFilesWithChanges = files.filter(file => changesByPath[file.path]);
      const otherFiles = files.filter(file => !changesByPath[file.path]).slice(0, 10); // Limit other files
      filesToShow = [...videoFilesWithChanges, ...otherFiles];
    } else {
      filesToShow = files.slice(0, 20);
    }

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Results
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Found {videoFiles.length} video file(s) in {files.length} total files
        </Typography>
        <List dense>
          {filesToShow.map((file, index) => {
            const change = changesByPath[file.path];
            const fileSizeMB = file.size && file.size > 0 ? (file.size / (1024 * 1024)).toFixed(2) : '0.00';
            
            // Debug log for file sizes
            if (index < 3) {
              console.log(`File ${file.name}: size=${file.size}, isDir=${file.isDir}`);
            }
            
            return (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {file.isDir ? <Folder /> :
                   change ? (
                     change.action === 126 ? <Warning color="warning" /> :
                     change.action === 200 ? <CheckCircle color="success" /> :
                     change.action === 300 ? <Error color="error" /> :
                     <VideoFile />
                   ) : <VideoFile />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {/* Original name */}
                      <Typography variant="body2">{file.name}</Typography>

                      {/* Chip for action */}
                      {change && (
                        <Chip
                          label={getActionInfo(change.action).label}
                          size="small"
                          color={getActionInfo(change.action).color}
                        />
                      )}

                      {/* Conflict flag */}
                      {change && change.conflict_ids && change.conflict_ids.length > 0 && (
                        <Chip label="CONFLICT" size="small" color="error" />
                      )}

                      {/* New name */}
                      {change && change.after && change.before.filename !== change.after.filename && (
                        <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                          → {change.after.filename}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {file.isDir ? 'Directory' : `${fileSizeMB} MB`}
                      {file.modTime && ` • Modified: ${file.modTime}`}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
          {filesToShow.length < files.length && (
            <ListItem>
              <ListItemText secondary={`... and ${files.length - filesToShow.length} more files`} />
            </ListItem>
          )}
        </List>
      </Paper>
    );
  };

  const renderPlan = () => {
    if (!plan) return null;

    // Only show errors and summary statistics here since changes are now inline
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Plan Summary
        </Typography>
        
        {plan.errors && plan.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Errors:</Typography>
            {plan.errors.map((error, index) => (
              <Typography key={index} variant="body2">
                {error.file}: {error.message}
              </Typography>
            ))}
          </Alert>
        )}

        {plan.changes && plan.changes.length > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {plan.changes.filter(c => c.action === '~').length} files to rename, {' '}
            {plan.changes.filter(c => c.action === '✓').length} already correct, {' '}
            {plan.changes.filter(c => c.action === '✗').length} to skip
            {plan.changes.some(c => c.conflict_ids && c.conflict_ids.length > 0) && (
              <span style={{ color: 'red' }}> • Conflicts detected!</span>
            )}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No changes needed - all files are already properly named or no video files found.
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Rename Video Files
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Search for video files in a directory and create a rename plan based on TMDB data.
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Directory Path"
              variant="outlined"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              placeholder="Enter the path to scan for video files"
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Media Type</InputLabel>
              <Select
                value={mediaType}
                label="Media Type"
                onChange={(e) => setMediaType(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="auto">Auto Detect</MenuItem>
                <MenuItem value="movie">Movie</MenuItem>
                <MenuItem value="tv">TV Show</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={(e) => setProvider(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="tmdb">TMDB</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Recursive Scan"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleSearch}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleLookup}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                Lookup
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {renderFileList()}
      {renderPlan()}
    </Box>
  );
}

export default Rename;
