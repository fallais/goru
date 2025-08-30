import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import Rename from './components/Rename';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('rename');

  const renderPage = () => {
    switch (currentPage) {
      case 'rename':
        return <Rename />;
      default:
        return <Rename />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Goru - Video File Renaming Tool
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {renderPage()}
      </Container>
    </ThemeProvider>
  );
}

export default App;
