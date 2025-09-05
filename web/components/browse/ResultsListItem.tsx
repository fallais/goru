import React, { useCallback } from 'react';
import {
  ListItem,
  ListItemButton,
  Typography,
  Box,
} from '@mui/material';

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

interface ResultsListItemProps {
  change: PlanChange;
  onPlanResultHover?: (change: PlanChange) => void;
  onPlanResultHoverLeave?: () => void;
}

const ResultsListItem = React.memo(function ResultsListItem({
  change,
  onPlanResultHover,
  onPlanResultHoverLeave
}: ResultsListItemProps): React.JSX.Element {
  const handleMouseEnter = useCallback(() => {
    if (onPlanResultHover) {
      onPlanResultHover(change);
    }
  }, [onPlanResultHover, change]);

  const handleMouseLeave = useCallback(() => {
    if (onPlanResultHoverLeave) {
      onPlanResultHoverLeave();
    }
  }, [onPlanResultHoverLeave]);

  return (
    <ListItem
      data-file-path={change.before.path}
      sx={{ 
        px: 0, 
        py: 0,
        borderRadius: 1,
        transition: 'background-color 0.15s ease-in-out',
        '&[data-highlighted="true"]': {
          backgroundColor: 'primary.light',
        },
      }}
    >
      <ListItemButton
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
              {change.after?.filename || 'Unknown filename'}
            </Typography>
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
});

export default ResultsListItem;
