import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid2,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { Save } from '@mui/icons-material';

function Settings() {
  const [mediaType, setMediaType] = useState('auto');
  const [provider, setProvider] = useState('tmdb');
  const [recursive, setRecursive] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [confirmRenames, setConfirmRenames] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, you would save these settings to localStorage or backend
    localStorage.setItem('goname-settings', JSON.stringify({
      mediaType,
      provider,
      recursive,
      autoScan,
      showHidden,
      confirmRenames,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Media Detection Settings
        </Typography>
        
        <Grid2 container spacing={3} sx={{ mt: 1 }}>
          <Grid2 xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Default Media Type</InputLabel>
              <Select
                value={mediaType}
                label="Default Media Type"
                onChange={(e) => setMediaType(e.target.value)}
              >
                <MenuItem value="auto">Auto Detect</MenuItem>
                <MenuItem value="movie">Movie</MenuItem>
                <MenuItem value="tv">TV Show</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          
          <Grid2 xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={(e) => setProvider(e.target.value)}
              >
                <MenuItem value="tmdb">TMDB</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
        </Grid2>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Scanning Options
        </Typography>
        
        <Grid2 container spacing={2} sx={{ mt: 1 }}>
          <Grid2 xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                />
              }
              label="Scan subdirectories recursively"
            />
          </Grid2>
          
          <Grid2 xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                />
              }
              label="Auto-scan when entering directories"
            />
          </Grid2>
          
          <Grid2 xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                />
              }
              label="Show hidden files"
            />
          </Grid2>
          
          <Grid2 xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmRenames}
                  onChange={(e) => setConfirmRenames(e.target.checked)}
                />
              }
              label="Confirm before renaming files"
            />
          </Grid2>
        </Grid2>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{ 
              backgroundColor: '#ff8c00', 
              '&:hover': { backgroundColor: '#ff7c00' }
            }}
          >
            Save Settings
          </Button>
          
          {saved && (
            <Alert severity="success" sx={{ flexGrow: 1 }}>
              Settings saved successfully!
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Settings;
