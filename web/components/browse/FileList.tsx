import React, { useMemo, useCallback, useRef, useEffect } from 'react';
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

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

interface PlanChange {
  before: {
    path: string;
    name: string;
  };
  after: {
    path: string;
    name: string;
  };
  action: number;
}

interface Plan {
  changes: PlanChange[];
}

interface FileListProps {
  files: FileItem[];
  plan?: Plan | null;
  loading: boolean;
  currentPath: string;
  highlightedFilePath?: string | null;
  onFileClick: (file: FileItem) => void;
  onDirectoryClick: (dirPath: string) => void;
  onFileHover: (filePath: string) => void;
  onFileHoverLeave: () => void;
}

const FileList = React.memo(function FileList({ 
  files, 
  plan, 
  loading, 
  currentPath,
  highlightedFilePath,
  onFileClick, 
  onDirectoryClick,
  onFileHover,
  onFileHoverLeave
}: FileListProps): React.JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);
  
  // Use effect to update data-highlighted attributes when highlightedFilePath changes
  useEffect(() => {
    if (!listRef.current) return;
    
    // Clear all previous highlights
    const allItems = listRef.current.querySelectorAll('[data-file-path]');
    allItems.forEach(item => {
      item.removeAttribute('data-highlighted');
    });
    
    // Set highlight for current path
    if (highlightedFilePath) {
      // Find the exact item by comparing the attribute value
      const allItems = listRef.current.querySelectorAll('[data-file-path]');
      for (const item of allItems) {
        if (item.getAttribute('data-file-path') === highlightedFilePath) {
          item.setAttribute('data-highlighted', 'true');
          break;
        }
      }
    }
  }, [highlightedFilePath]);
  // Memoize the file categorization
  const { videoFiles, directories, otherFiles } = useMemo(() => {
    return categorizeFiles(files);
  }, [files]);

  // Memoize helper functions to avoid recreating them on each render
  const hasFileChanges = useCallback((file: FileItem): boolean => {
    if (!plan || !plan.changes) return false;
    return plan.changes.some(change => change.before.path === file.path);
  }, [plan]);

  const getFileChange = useCallback((file: FileItem): PlanChange | null => {
    if (!plan || !plan.changes) return null;
    return plan.changes.find(change => change.before.path === file.path) || null;
  }, [plan]);
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

      <List dense sx={{ pt: 0 }} ref={listRef}>
        {/* Directories first */}
        {directories.map((file, index) => (
          <FileListItem
            key={`dir-${index}`}
            file={file}
            fileType="directory"
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
});

export default FileList;
