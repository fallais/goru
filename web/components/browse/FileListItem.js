import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Folder,
  VideoFile,
} from '@mui/icons-material';

function FileListItem({ file, fileType, onFileClick, onDirectoryClick }) {
  const handleClick = () => {
    if (file.isDir) {
      onDirectoryClick(file.path);
    } else {
      onFileClick(file);
    }
  };

  const renderIcon = () => {
    if (file.isDir) {
      return <Folder color="primary" />;
    }

    return <VideoFile color={fileType === 'other' ? 'disabled' : 'inherit'} />;
  };

  const renderPrimaryText = () => {
    if (file.isDir) {
      return (
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {file.name}
        </Typography>
      );
    }

    if (fileType === 'video') {
      return (
        <Typography variant="body2">{file.name}</Typography>
      );
    }

    // Other files
    return (
      <Typography variant="body2" color="text.secondary">
        {file.name}
      </Typography>
    );
  };

  return (
    <ListItem divider>
      <ListItemButton onClick={handleClick}>
        <ListItemIcon>
          {renderIcon()}
        </ListItemIcon>
        <ListItemText
          primary={renderPrimaryText()}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default FileListItem;
