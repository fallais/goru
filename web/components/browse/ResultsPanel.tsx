import React, { useMemo, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  Box,
  Chip,
} from '@mui/material';
import { categorizeFiles } from '../../utils/fileUtils';
import ResultsListItem from './ResultsListItem';

interface PlanChange {
  before: {
    path: string;
    filename: string;
  };
  after: {
    path: string;
    filename: string;
  };
  action: number;
}

interface Plan {
  changes: PlanChange[];
}

interface ResultsPanelProps {
  plan?: Plan | null;
  loading: boolean;
  highlightedFilePath?: string | null;
  onPlanResultHover?: (change: PlanChange) => void;
  onPlanResultHoverLeave?: () => void;
}

const ResultsPanel = React.memo(function ResultsPanel({ 
  plan, 
  loading, 
  highlightedFilePath, 
  onPlanResultHover, 
  onPlanResultHoverLeave 
}: ResultsPanelProps): React.JSX.Element {
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
  // Memoize the ordered changes calculation
  const orderedChanges = useMemo(() => {
    if (!plan || !plan.changes || plan.changes.length === 0) {
      return [];
    }

    // Create a sorted list of changes based on file categorization
    const changesByPath: Record<string, PlanChange> = {};
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
    const ordered: PlanChange[] = [];
    
    // Add directory changes first (if any)
    directories.forEach(file => {
      const change = changesByPath[file.path];
      if (change) ordered.push(change);
    });
    
    // Add video file changes
    videoFiles.forEach(file => {
      const change = changesByPath[file.path];
      if (change) ordered.push(change);
    });
    
    // Add other file changes
    otherFiles.forEach(file => {
      const change = changesByPath[file.path];
      if (change) ordered.push(change);
    });

    return ordered;
  }, [plan]);
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

      <List dense sx={{ pt: 0 }} ref={listRef}>
        {orderedChanges.map((change, index) => (
          <ResultsListItem
            key={index}
            change={change}
            onPlanResultHover={onPlanResultHover}
            onPlanResultHoverLeave={onPlanResultHoverLeave}
          />
        ))}
      </List>
    </Paper>
  );
});

export default ResultsPanel;
