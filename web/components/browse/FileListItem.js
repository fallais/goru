import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Folder,
  VideoFile,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { getActionInfo, formatFileSize } from '../../utils/fileUtils';

function FileListItem({ file, fileType, change, onFileClick, onDirectoryClick }) {
  const fileSizeMB = file.size && file.size > 0 ? (file.size / (1024 * 1024)).toFixed(2) : '0.00';

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

    if (fileType === 'video' && change) {
      switch (change.action) {
        case 126:
          return <Warning color="warning" />;
        case 200:
          return <CheckCircle color="success" />;
        case 300:
          return <Error color="error" />;
        default:
          return <VideoFile />;
      }
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
      );
    }

    // Other files
    return (
      <Typography variant="body2" color="text.secondary">
        {file.name}
      </Typography>
    );
  };

  const getSecondaryText = () => {
    if (file.isDir) {
      return `Directory • Modified: ${file.modTime}`;
    }
    return `${fileSizeMB} MB • Modified: ${file.modTime}`;
  };

  return (
    <ListItem divider>
      <ListItemButton onClick={handleClick}>
        <ListItemIcon>
          {renderIcon()}
        </ListItemIcon>
        <ListItemText
          primary={renderPrimaryText()}
          secondary={getSecondaryText()}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default FileListItem;
