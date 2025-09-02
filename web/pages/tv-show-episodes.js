import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Home,
  Search,
} from '@mui/icons-material';
import TVShowEpisodes from '../components/TVShowEpisodes';

export default function TVShowEpisodesPage() {
  const router = useRouter();
  const { showId, showTitle } = router.query;
  const [showData, setShowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showId) {
      fetchShowData();
    }
  }, [showId]);

  const fetchShowData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // You might want to fetch additional show details here
      // For now, we'll use the data passed through the query
      setShowData({
        id: showId,
        title: showTitle || 'TV Show',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoToSearch = () => {
    router.push('/search?type=tv');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 2, mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={handleGoHome}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={handleGoToSearch}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Search sx={{ mr: 0.5 }} fontSize="inherit" />
          TV Shows Search
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {showData?.title} Episodes
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          {showData?.title} - Episodes
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
          variant="outlined"
        >
          Back to Search
        </Button>
      </Box>

      {/* Episodes Component */}
      <TVShowEpisodes showId={showId} showData={showData} />
    </Container>
  );
}
