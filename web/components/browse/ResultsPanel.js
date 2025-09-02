import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Box,
  Chip,
} from '@mui/material';
import { categorizeFiles } from '../../utils/fileUtils';

function ResultsPanel({ plan, loading, highlightedFilePath, onPlanResultHover, onPlanResultHoverLeave }) {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Plan Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading plan results...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!plan || !plan.changes || plan.changes.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Plan Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No changes to display. Run Plan to see proposed file renames.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
      <Box sx={{ minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>
          Plan Results
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`${plan.changes.length} file(s) to rename`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </Box>

      <List dense sx={{ pt: 0 }}>
        {(() => {
          // Create a sorted list of changes based on file categorization
          const changesByPath = {};
          plan.changes.forEach(change => {
            changesByPath[change.before.path] = change;
          });

          // Create file objects for sorting using the BEFORE filename 
          // (this is what appears in the directory listing)
          const fileObjects = plan.changes.map(change => ({
            name: change.before.filename,
            isDir: false, // Plan changes are typically files, not directories
            path: change.before.path
          }));

          // Categorize and sort the files the same way as FileList
          const { videoFiles, directories, otherFiles } = categorizeFiles(fileObjects);
          
          // Create ordered list of changes following the same pattern as FileList
          const orderedChanges = [];
          
          // Add directory changes first (if any)
          directories.forEach(file => {
            const change = changesByPath[file.path];
            if (change) orderedChanges.push(change);
          });
          
          // Add video file changes
          videoFiles.forEach(file => {
            const change = changesByPath[file.path];
            if (change) orderedChanges.push(change);
          });
          
          // Add other file changes
          otherFiles.forEach(file => {
            const change = changesByPath[file.path];
            if (change) orderedChanges.push(change);
          });

          return orderedChanges.map((change, index) => {
            const isHighlighted = highlightedFilePath === change.before.path;
            
            return (
              <ListItem
                key={index}
                sx={{ 
                  px: 0, 
                  py: 0,
                  backgroundColor: isHighlighted ? 'primary.light' : 'transparent',
                  borderRadius: 1,
                }}
              >
                <ListItemButton
                  onMouseEnter={() => onPlanResultHover && onPlanResultHover(change)}
                  onMouseLeave={() => onPlanResultHoverLeave && onPlanResultHoverLeave()}
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
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
                        {change.after?.filename || 'Unknown filename'}
                      </Typography>
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          });
        })()}
      </List>
    </Paper>
  );
}

export default ResultsPanel;
