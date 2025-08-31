import React from 'react';
import { Box, Divider } from '@mui/material';
import Settings from '../components/Settings';
import TestNotifications from '../components/TestNotifications';

export default function SettingsPage() {
  return (
    <Box>
      <Settings />
      <Divider sx={{ my: 4 }} />
      <TestNotifications />
    </Box>
  );
}
