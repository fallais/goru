import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Button,
  TextField,
  Box,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Search,
  Settings as SettingsIcon,
  FolderOpen,
  FindInPage,
  History,
  ArrowDropDown,
  Movie,
  Tv,
} from '@mui/icons-material';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../lib/createEmotionCache';
import { useRouter } from 'next/router';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';
import { DirectoryProvider } from '../contexts/DirectoryContext';
import NotificationSnackbar from '../components/NotificationSnackbar';
import AxiosSetup from '../components/AxiosSetup';
import { setupAxiosInterceptors } from '../lib/axios';

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
  const [searchPath, setSearchPath] = useState('');
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);

  const handleNavigate = (path) => {
    router.push(path);
  };

  const handleSearchClick = (event) => {
    setSearchAnchorEl(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
  };

  const handleSearchOption = (type) => {
    handleNavigate(`/search?type=${type}`);
    handleSearchClose();
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
        <NotificationProvider>
          <DirectoryProvider>
            <AxiosSetup />
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ mr: 4 }}>
                Goru
              </Typography>
              
              {/* Navigation Menu */}
              <Button
                color="inherit"
                startIcon={<FolderOpen />}
                onClick={() => handleNavigate('/')}
                sx={{ mr: 2 }}
              >
                Browse
              </Button>
            
              
              <Button
                color="inherit"
                startIcon={<Search />}
                endIcon={<ArrowDropDown />}
                onClick={handleSearchClick}
                sx={{ mr: 2 }}
              >
                Search
              </Button>
              <Menu
                anchorEl={searchAnchorEl}
                open={Boolean(searchAnchorEl)}
                onClose={handleSearchClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <MenuItem onClick={() => handleSearchOption('tv')}>
                  <Tv sx={{ mr: 1 }} />
                  TV Shows
                </MenuItem>
                <MenuItem onClick={() => handleSearchOption('movies')}>
                  <Movie sx={{ mr: 1 }} />
                  Movies
                </MenuItem>
              </Menu>
              
              <Button
                color="inherit"
                startIcon={<History />}
                onClick={() => handleNavigate('/state')}
                sx={{ mr: 2 }}
              >
                State
              </Button>
              
              <Button
                color="inherit"
                startIcon={<SettingsIcon />}
                onClick={() => handleNavigate('/settings')}
                sx={{ mr: 2 }}
              >
                Settings
              </Button>
            </Toolbar>
          </AppBar>
          <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
            <Component {...pageProps} searchPath={searchPath} />
          </Container>
          <NotificationSnackbar />
        </DirectoryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
