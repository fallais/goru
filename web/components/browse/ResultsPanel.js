import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { categorizeFiles } from '../../utils/fileUtils';

function ResultsPanel({ plan, loading }) {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom>
          Plan Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading plan results...
        </Typography>
      </Paper>
    );
  }

  if (!plan || !plan.changes || plan.changes.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom>
          Plan Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No changes to display. Run Plan to see proposed file renames.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
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

      <List dense>
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

          return orderedChanges.map((change, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.primary">
                    {change.after?.filename || 'Unknown filename'}
                  </Typography>
                </Box>
              </ListItem>
              {index < orderedChanges.length - 1 && <Divider />}
            </React.Fragment>
          ));
        })()}
      </List>
    </Paper>
  );
}

export default ResultsPanel;
