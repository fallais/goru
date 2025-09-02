import React from 'react';
import { useRouter } from 'next/router';
import { Container, Typography } from '@mui/material';
import Search from '../components/Search';

export default function SearchPage() {
  const router = useRouter();
  const { type } = router.query;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Search {type === 'tv' ? 'TV Shows' : type === 'movies' ? 'Movies' : 'Content'}
      </Typography>
      <Search searchType={type} />
    </Container>
  );
}
