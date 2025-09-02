import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import FileListItem from './FileListItem';
import { categorizeFiles } from '../../utils/fileUtils';

function FileList({ 
  files, 
  plan, 
  loading, 
  currentPath,
  highlightedFilePath,
  onFileClick, 
  onDirectoryClick,
  onFileHover,
  onFileHoverLeave
}) {
  if (files.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Directory Contents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading directory contents...' : 'No files found in this directory.'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  const { videoFiles, directories, otherFiles } = categorizeFiles(files);

  // Helper function to check if a file has plan changes
  const hasFileChanges = (file) => {
    if (!plan || !plan.changes) return false;
    return plan.changes.some(change => change.before.path === file.path);
  };

  // Helper function to get the plan change for a file
  const getFileChange = (file) => {
    if (!plan || !plan.changes) return null;
    return plan.changes.find(change => change.before.path === file.path) || null;
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Directory Contents
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Found {videoFiles.length} video file(s), {directories.length} folder(s), and {otherFiles.length} other file(s)
        </Typography>
      </Box>

      <List dense sx={{ pt: 0 }}>
        {/* Directories first */}
        {directories.map((file, index) => (
          <FileListItem
            key={`dir-${index}`}
            file={file}
            fileType="directory"
            isHighlighted={highlightedFilePath === file.path}
            hasPlanChanges={hasFileChanges(file)}
            planChange={getFileChange(file)}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
            onFileHover={onFileHover}
            onFileHoverLeave={onFileHoverLeave}
          />
        ))}

        {/* Video files */}
        {videoFiles.map((file, index) => (
          <FileListItem
            key={`video-${index}`}
            file={file}
            fileType="video"
            isHighlighted={highlightedFilePath === file.path}
            hasPlanChanges={hasFileChanges(file)}
            planChange={getFileChange(file)}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
            onFileHover={onFileHover}
            onFileHoverLeave={onFileHoverLeave}
          />
        ))}

        {/* Other files (limited display) */}
        {otherFiles.slice(0, 10).map((file, index) => (
          <FileListItem
            key={`other-${index}`}
            file={file}
            fileType="other"
            isHighlighted={highlightedFilePath === file.path}
            hasPlanChanges={hasFileChanges(file)}
            planChange={getFileChange(file)}
            onFileClick={onFileClick}
            onDirectoryClick={onDirectoryClick}
            onFileHover={onFileHover}
            onFileHoverLeave={onFileHoverLeave}
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
