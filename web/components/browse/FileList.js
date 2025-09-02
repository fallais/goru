import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
} from '@mui/icons-material';
import FileListItem from './FileListItem';
import { categorizeFiles, createChangesMap } from '../../utils/fileUtils';

function FileList({ 
  files, 
  plan, 
  loading, 
  currentPath,
  onFileClick, 
  onDirectoryClick, 
  onEditLookup 
}) {
  if (files.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Directory Contents
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{ 
              backgroundColor: '#4caf50', 
              '&:hover': { backgroundColor: '#45a049' },
              fontWeight: 'bold'
            }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Edit />}
            onClick={onEditLookup}
            disabled={loading || !currentPath || !currentPath.trim()}
          >
            Lookup
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading directory contents...' : 'No files found in this directory.'}
        </Typography>
      </Paper>
    );
  }

  const { videoFiles, directories, otherFiles } = categorizeFiles(files);
  const changesByPath = createChangesMap(plan);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Directory Contents
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{ 
            backgroundColor: '#4caf50', 
            '&:hover': { backgroundColor: '#45a049' },
            fontWeight: 'bold'
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Edit />}
          onClick={onEditLookup}
          disabled={loading || !currentPath || !currentPath.trim()}
        >
          Lookup
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Found {videoFiles.length} video file(s), {directories.length} folder(s), and {otherFiles.length} other file(s)
      </Typography>

      <List dense>
        {/* Directories first */}
        {directories.map((file, index) => (
          <FileListItem
            key={`dir-${index}`}
            file={file}
            fileType="directory"
            change={null}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
          />
        ))}

        {/* Video files */}
        {videoFiles.map((file, index) => (
          <FileListItem
            key={`video-${index}`}
            file={file}
            fileType="video"
            change={changesByPath[file.path]}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
          />
        ))}

        {/* Other files (limited display) */}
        {otherFiles.slice(0, 10).map((file, index) => (
          <FileListItem
            key={`other-${index}`}
            file={file}
            fileType="other"
            change={null}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
          />
        ))}
        
        {otherFiles.length > 10 && (
          <ListItem>
            <ListItemText secondary={`... and ${otherFiles.length - 10} more files`} />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}

export default FileList;
