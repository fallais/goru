import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Button,
  Menu,
  MenuItem,
  TextField,
  Box,
  InputAdornment,
} from '@mui/material';
import { 
  Search,
  Settings as SettingsIcon,
  FolderOpen,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../lib/createEmotionCache';
import { useRouter } from 'next/router';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
  },
});

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchPath, setSearchPath] = useState('');

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    router.push(path);
    handleMenuClose();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchPath.trim()) {
      // Navigate to browse page with search path as query parameter
      router.push(`/?path=${encodeURIComponent(searchPath.trim())}`);
    }
  };

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ mr: 4 }}>
              Goru
            </Typography>
            
            {/* Navigation Menu */}
            <Button
              color="inherit"
              startIcon={<FolderOpen />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleMenuClick}
              sx={{ mr: 2 }}
            >
              Browse
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleNavigate('/')}>
                <FolderOpen sx={{ mr: 1 }} />
                Browse Files
              </MenuItem>
              <MenuItem onClick={() => handleNavigate('/settings')}>
                <SettingsIcon sx={{ mr: 1 }} />
                Settings
              </MenuItem>
            </Menu>
            
            {/* Search Bar */}
            <Box sx={{ flexGrow: 1, mx: 2 }}>
              <TextField
                size="small"
                placeholder="Jump to directory path..."
                value={searchPath}
                onChange={(e) => setSearchPath(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                }}
                fullWidth
              />
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Component {...pageProps} searchPath={searchPath} />
        </Container>
      </ThemeProvider>
    </CacheProvider>
  );
}
