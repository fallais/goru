import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Info,
  ExpandMore,
} from '@mui/icons-material';

const TMDBResults = ({ 
  results, 
  loading, 
  selectedItem, 
  onSelectItem, 
  tvSearchSeason 
}) => {
  console.log('TMDBResults received:', { results, loading }); // Debug log
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center">
        No search results yet. Use the search forms above to find movies or TV shows.
      </Typography>
    );
  }

  return (
    <List>
      {results.map((item, index) => {
        // Create a unique identifier for each item
        const itemId = item.id || item.external_ids?.tmdb_id || `${item.name}-${item.first_air_date || item.release_date}-${index}`;
        const selectedItemId = selectedItem?.id || selectedItem?.external_ids?.tmdb_id || 
          (selectedItem ? `${selectedItem.name}-${selectedItem.first_air_date || selectedItem.release_date}` : null);
        
        return (
          <ListItem key={itemId} disablePadding sx={{ mb: 1 }}>
            <Card 
              sx={{ 
                width: '100%',
                ...(selectedItem && itemId === selectedItemId && {
                  border: '2px solid',
                  borderColor: 'primary.main'
                })
              }} 
              variant="outlined"
            >
              <CardContent>
                <Typography variant="h6" component="div">
                  {item.title || item.name}
                </Typography>
                {item.original_name && item.original_name !== (item.title || item.name) && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Original: {item.original_name}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {item.release_date || item.first_air_date ? 
                    new Date(item.release_date || item.first_air_date).getFullYear() : 
                    'Release date unknown'
                  }
                </Typography>
                {item.genre && (
                  <Typography variant="body2" color="text.secondary">
                    Genre: {item.genre}
                  </Typography>
                )}
                {item.director && (
                  <Typography variant="body2" color="text.secondary">
                    Director: {item.director}
                  </Typography>
                )}
                {item.seasons > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {item.seasons} Season{item.seasons !== 1 ? 's' : ''}, {item.episodes} Episode{item.episodes !== 1 ? 's' : ''}
                  </Typography>
                )}
                {item.external_ids && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    TMDB ID: {item.external_ids.tmdb_id}
                    {item.external_ids.tvdb_id && ` | TVDB ID: ${item.external_ids.tvdb_id}`}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {item.overview && item.overview.length > 150
                    ? `${item.overview.substring(0, 150)}...`
                    : item.overview || 'No description available.'}
                </Typography>
                
                {/* Show episodes if available */}
                {item.episodes && item.episodes.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">
                        Season {tvSearchSeason} Episodes ({item.episodes.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {item.episodes.map((episode) => (
                          <ListItem key={episode.id}>
                            <ListItemText
                              primary={`${episode.episode_number}. ${episode.name}`}
                              secondary={episode.overview && episode.overview.length > 100
                                ? `${episode.overview.substring(0, 100)}...`
                                : episode.overview}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => onSelectItem({...item, id: itemId})}
                  startIcon={selectedItem && itemId === selectedItemId ? <CheckCircle /> : <Info />}
                  variant={selectedItem && itemId === selectedItemId ? "contained" : "outlined"}
                >
                  {selectedItem && itemId === selectedItemId ? "Selected" : "Use This"}
                </Button>
              </CardActions>
            </Card>
          </ListItem>
        );
      })}
    </List>
  );
};

export default TMDBResults;
