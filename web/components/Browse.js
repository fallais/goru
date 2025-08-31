import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Breadcrumbs,
  Link,
  Modal,
  Backdrop,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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
  Home,
  ArrowUpward,
  Refresh,
  Close,
  Info,
} from '@mui/icons-material';
import axios from 'axios';
import { useApiCall } from '../hooks/useApiCall';
import { useNotification } from '../contexts/NotificationContext';

function Browse({ searchPath }) {
  const router = useRouter();
  const apiCall = useApiCall();
  const { showError } = useNotification();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState('auto');
  const [provider, setProvider] = useState('tmdb');
  const [recursive, setRecursive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hideNonVideoFiles, setHideNonVideoFiles] = useState(false);

  // Load current directory on component mount
  useEffect(() => {
    loadCurrentDirectory();
  }, []);

  // Handle search path from App Bar
  useEffect(() => {
    if (router.query.path) {
      loadDirectory(router.query.path);
      // Clear the query parameter
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.path]);

  const loadCurrentDirectory = async () => {
    setLoading(true);
    
    const result = await apiCall.get('/api/current', {
      errorPrefix: 'Failed to load current directory'
    });
    
    if (result.success) {
      console.log('Current directory API response:', result.data.data);
      setCurrentPath(result.data.data.path);
      setFiles(result.data.data.files || []);
    }
    
    setLoading(false);
  };

  const loadDirectory = async (path) => {
    setLoading(true);
    setFiles([]);
    setPlan(null); // Clear previous plan when navigating

    const result = await apiCall.get('/api/directory', {
      params: { path: path },
      errorPrefix: 'Failed to load directory'
    });

    if (result.success) {
      console.log('Directory API response:', result.data.data);
      setCurrentPath(result.data.data.path);
      setFiles(result.data.data.files || []);
    }
    
    setLoading(false);
  };

  const handleDirectoryClick = (dirPath) => {
    loadDirectory(dirPath);
  };

  const handleParentDirectory = () => {
    if (currentPath) {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
      if (parentPath && parentPath.length > 0) {
        loadDirectory(parentPath);
      }
    }
  };

  const handleLookup = async () => {
    if (!currentPath.trim()) {
      showError('No directory loaded');
      return;
    }

    setLoading(true);
    setPlan(null);

    const result = await apiCall.post('/api/lookup', {
      directory: currentPath,
      type: mediaType,
      provider: provider,
      recursive: recursive,
    }, {
      errorPrefix: 'Failed to lookup media information'
    });

    if (result.success) {
      console.log('Lookup API response:', result.data.data);
      setPlan(result.data.data.plan);
    }
    
    setLoading(false);
  };

  const handleApply = async () => {
    if (!plan || !plan.changes || plan.changes.length === 0) {
      showError('No plan to apply');
      return;
    }

    setLoading(true);

    const result = await apiCall.post('/api/apply', {
      plan: plan,
    }, {
      errorPrefix: 'Failed to apply changes',
      successMessage: 'Changes applied successfully!',
      showSuccessNotification: true
    });

    if (result.success) {
      console.log('Apply API response:', result.data.data);
      // Refresh the directory to show the updated file names
      await loadDirectory(currentPath);
      setPlan(null); // Clear the plan after successful application
    }
    
    setLoading(false);
  };

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

  // Modal handlers
  const handleFileClick = (file) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  // Render file info modal
  const renderFileInfoModal = () => {
    if (!selectedFile) return null;

    const fileSizeMB = selectedFile.size && selectedFile.size > 0 ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0.00';
    const change = plan?.changes?.find(c => c.before.path === selectedFile.path);

    return (
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={modalOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 },
            maxHeight: '80vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                File Information
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <Close />
              </IconButton>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      File Name
                    </TableCell>
                    <TableCell>{selectedFile.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Full Path
                    </TableCell>
                    <TableCell sx={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
                      {selectedFile.path}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      File Type
                    </TableCell>
                    <TableCell>
                      {selectedFile.isDir ? 'Directory' : getFileExtension(selectedFile.name)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Size
                    </TableCell>
                    <TableCell>
                      {selectedFile.isDir ? 'N/A' : formatFileSize(selectedFile.size)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Last Modified
                    </TableCell>
                    <TableCell>{selectedFile.modTime}</TableCell>
                  </TableRow>
                  {change && (
                    <>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Planned Action
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getActionInfo(change.action).label}
                            size="small"
                            color={getActionInfo(change.action).color}
                          />
                        </TableCell>
                      </TableRow>
                      {change.after && change.before.filename !== change.after.filename && (
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            New Name
                          </TableCell>
                          <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            {change.after.filename}
                          </TableCell>
                        </TableRow>
                      )}
                      {change.conflict_ids && change.conflict_ids.length > 0 && (
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            Conflicts
                          </TableCell>
                          <TableCell>
                            <Chip label="CONFLICT DETECTED" size="small" color="error" />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseModal} variant="contained">
                Close
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    );
  };

  const renderBreadcrumbs = () => {
    if (!currentPath) return null;
    
    const parts = currentPath.split('\\').filter(part => part.length > 0);
    
    return (
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              loadCurrentDirectory(); 
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          {parts.map((part, index) => {
            const isLast = index === parts.length - 1;
            const path = parts.slice(0, index + 1).join('\\');
            
            if (isLast) {
              return (
                <Typography key={index} color="text.primary">
                  {part}
                </Typography>
              );
            }
            
            return (
              <Link
                key={index}
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  loadDirectory(path);
                }}
              >
                {part}
              </Link>
            );
          })}
        </Breadcrumbs>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<ArrowUpward />}
            onClick={handleParentDirectory}
            disabled={loading || !currentPath}
          >
            Parent
          </Button>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={() => loadDirectory(currentPath)}
            disabled={loading || !currentPath}
          >
            Refresh
          </Button>
        </Box>
      </Box>
    );
  };

  const renderFileList = () => {
    if (files.length === 0) {
      return (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Directory Contents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading directory contents...' : 'No files found in this directory.'}
          </Typography>
        </Paper>
      );
    }

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

    const directories = files.filter(file => file.isDir);
    const otherFiles = files.filter(file => !file.isDir && !videoFiles.includes(file));

    // Create a map of changes by file path for quick lookup
    const changesByPath = {};
    if (plan && plan.changes) {
      plan.changes.forEach(change => {
        changesByPath[change.before.path] = change;
      });
    }

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Directory Contents
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Found {videoFiles.length} video file(s), {directories.length} folder(s){!hideNonVideoFiles && `, and ${otherFiles.length} other file(s)`}
        </Typography>

        <List dense>
          {/* Directories first */}
          {directories.map((file, index) => (
            <ListItem key={`dir-${index}`} divider>
              <ListItemButton onClick={() => handleDirectoryClick(file.path)}>
                <ListItemIcon>
                  <Folder color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {file.name}
                    </Typography>
                  }
                  secondary={`Directory • Modified: ${file.modTime}`}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Video files */}
          {videoFiles.map((file, index) => {
            const change = changesByPath[file.path];
            const fileSizeMB = file.size && file.size > 0 ? (file.size / (1024 * 1024)).toFixed(2) : '0.00';
            
            return (
              <ListItem key={`video-${index}`} divider>
                <ListItemButton onClick={() => handleFileClick(file)}>
                  <ListItemIcon>
                    {change ? (
                      change.action === 126 ? <Warning color="warning" /> :
                      change.action === 200 ? <CheckCircle color="success" /> :
                      change.action === 300 ? <Error color="error" /> :
                      <VideoFile />
                    ) : <VideoFile />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2">{file.name}</Typography>

                        {change && (
                          <Chip
                            label={getActionInfo(change.action).label}
                            size="small"
                            color={getActionInfo(change.action).color}
                          />
                        )}

                        {change && change.conflict_ids && change.conflict_ids.length > 0 && (
                          <Chip label="CONFLICT" size="small" color="error" />
                        )}

                        {change && change.after && change.before.filename !== change.after.filename && (
                          <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                            → {change.after.filename}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={`${fileSizeMB} MB • Modified: ${file.modTime}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Other files (limited display) */}
          {!hideNonVideoFiles && otherFiles.slice(0, 10).map((file, index) => {
            const fileSizeMB = file.size && file.size > 0 ? (file.size / (1024 * 1024)).toFixed(2) : '0.00';
            
            return (
              <ListItem key={`other-${index}`} divider>
                <ListItemButton onClick={() => handleFileClick(file)}>
                  <ListItemIcon>
                    <VideoFile color="disabled" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {file.name}
                      </Typography>
                    }
                    secondary={`${fileSizeMB} MB • Modified: ${file.modTime}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          
          {!hideNonVideoFiles && otherFiles.length > 10 && (
            <ListItem>
              <ListItemText secondary={`... and ${otherFiles.length - 10} more files`} />
            </ListItem>
          )}
        </List>
      </Paper>
    );
  };

  const renderSidebar = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Options Panel */}
        <Paper sx={{ p: 2, height: 'fit-content', position: 'sticky', top: 16 }}>
          <Typography variant="h6" gutterBottom>
            Options
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideNonVideoFiles}
                  onChange={(e) => setHideNonVideoFiles(e.target.checked)}
                />
              }
              label="Hide non-video files"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Recursive scan"
            />
          </Box>
        </Paper>

        {/* Lookup Panel */}
        <Paper sx={{ p: 2, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            Lookup
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={mediaType}
                label="Type"
                onChange={(e) => setMediaType(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="movie">Movie</MenuItem>
                <MenuItem value="tv">TV</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" fullWidth>
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
            
            <Button
              variant="contained"
              sx={{ 
                backgroundColor: '#4caf50', 
                '&:hover': { backgroundColor: '#45a049' },
                fontWeight: 'bold'
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={handleLookup}
              disabled={loading}
            >
              Lookup
            </Button>
            
            <Button
              variant="contained"
              sx={{ 
                backgroundColor: plan && plan.changes && plan.changes.length > 0 ? '#ff8c00' : 'grey.400',
                '&:hover': { 
                  backgroundColor: plan && plan.changes && plan.changes.length > 0 ? '#ff7c00' : 'grey.400' 
                },
                fontWeight: 'bold'
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={handleApply}
              disabled={loading || !plan || !plan.changes || plan.changes.length === 0}
            >
              Apply
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Left Sidebar */}
      <Box sx={{ width: 250, flexShrink: 0 }}>
        {renderSidebar()}
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        {renderBreadcrumbs()}

        {renderFileList()}
        {renderFileInfoModal()}
      </Box>
    </Box>
  );
}

export default Browse;
