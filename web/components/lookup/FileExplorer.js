import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Folder, VideoFile, Refresh } from '@mui/icons-material';

const FileExplorer = ({ 
  selectedDirectory,
  files,
  loadingFiles,
  selectedFile,
  onFileSelect,
  onRefresh,
}) => {
  const filteredFiles = files; // You can add filtering logic here if needed

  return (
    <Paper elevation={2} sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Folder sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {selectedDirectory ? `Files from: ${selectedDirectory.name}` : 'No directory selected'}
        </Typography>
        {selectedDirectory && (
          <IconButton 
            onClick={onRefresh} 
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
                  onClick={() => onFileSelect(file)}
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
  );
};

export default FileExplorer;
