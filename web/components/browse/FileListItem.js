import React from 'react';
import {
  ListItem,
  ListItemButton,
  Typography,
  Box,
} from '@mui/material';

function FileListItem({ 
  file, 
  fileType, 
  isHighlighted = false,
  hasPlanChanges = false,
  planChange = null,
  onFileClick, 
  onDirectoryClick,
  onFileHover,
  onFileHoverLeave
}) {
  const handleClick = () => {
    if (file.isDir) {
      onDirectoryClick(file.path);
    } else {
      onFileClick(file);
    }
  };

  const handleMouseEnter = () => {
    if (hasPlanChanges && onFileHover) {
      onFileHover(file.path);
    }
  };

  const handleMouseLeave = () => {
    if (hasPlanChanges && onFileHoverLeave) {
      onFileHoverLeave();
    }
  };

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
      sx={{
        px: 0,
        py: 0,
        backgroundColor: isHighlighted ? 'primary.light' : 'transparent',
        borderRadius: 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          px: 2,
          py: 1,
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
}

export default FileListItem;
