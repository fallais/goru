import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import FileListItem from './FileListItem';
import { categorizeFiles } from '../../utils/fileUtils';

function FileList({ 
  files, 
  plan, 
  loading, 
  currentPath,
  onFileClick, 
  onDirectoryClick 
}) {
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

  const { videoFiles, directories, otherFiles } = categorizeFiles(files);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Directory Contents
      </Typography>
      
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
