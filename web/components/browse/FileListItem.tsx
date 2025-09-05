import React, { useCallback } from 'react';
import {
  ListItem,
  ListItemButton,
  Typography,
  Box,
} from '@mui/material';

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

interface FileListItemProps {
  file: FileItem;
  fileType: 'directory' | 'video' | 'other';
  hasPlanChanges?: boolean;
  planChange?: PlanChange | null;
  onFileClick: (file: FileItem) => void;
  onDirectoryClick: (dirPath: string) => void;
  onFileHover?: (filePath: string) => void;
  onFileHoverLeave?: () => void;
}

const FileListItem = React.memo(function FileListItem({ 
  file, 
  fileType, 
  hasPlanChanges = false,
  planChange = null,
  onFileClick, 
  onDirectoryClick,
  onFileHover,
  onFileHoverLeave
}: FileListItemProps): React.JSX.Element {
  const handleClick = useCallback(() => {
    if (file.isDir) {
      onDirectoryClick(file.path);
    } else {
      onFileClick(file);
    }
  }, [file.isDir, file.path, file, onDirectoryClick, onFileClick]);

  const handleMouseEnter = useCallback(() => {
    if (hasPlanChanges && onFileHover) {
      onFileHover(file.path);
    }
  }, [hasPlanChanges, onFileHover, file.path]);

  const handleMouseLeave = useCallback(() => {
    if (hasPlanChanges && onFileHoverLeave) {
      onFileHoverLeave();
    }
  }, [hasPlanChanges, onFileHoverLeave]);

  const renderIcon = () => {
    // No icons at all for perfect alignment
    return null;
  };

  const renderPrimaryText = () => {
    return (
      <Typography 
        variant="body2" 
        color="text.primary" 
        sx={{ 
          fontWeight: 'medium',
          color: file.isDir ? 'primary.main' : (hasPlanChanges ? 'primary.main' : 'text.primary'),
          opacity: fileType === 'other' ? 0.7 : 1
        }}
      >
        {file.isDir ? `📁 ${file.name}` : file.name}
      </Typography>
    );
  };

  return (
    <ListItem 
      data-file-path={file.path}
      sx={{
        px: 0,
        py: 0,
        borderRadius: 1,
        transition: 'background-color 0.15s ease-in-out',
        '&[data-highlighted="true"]': {
          backgroundColor: 'primary.light',
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          px: 2,
          py: 1,
          transition: 'background-color 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'grey.100',
          },
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            {renderPrimaryText()}
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
});

export default FileListItem;
