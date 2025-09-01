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
      {results.map((item, index) => (
        <ListItem key={item.id || index} disablePadding sx={{ mb: 1 }}>
          <Card 
            sx={{ 
              width: '100%',
              ...(selectedItem && selectedItem.id === item.id && {
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
              <Typography variant="body2" color="text.secondary">
                {item.release_date || item.first_air_date}
              </Typography>
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
                onClick={() => onSelectItem(item)}
                startIcon={selectedItem && selectedItem.id === item.id ? <CheckCircle /> : <Info />}
                variant={selectedItem && selectedItem.id === item.id ? "contained" : "outlined"}
              >
                {selectedItem && selectedItem.id === item.id ? "Selected" : "Use This"}
              </Button>
            </CardActions>
          </Card>
        </ListItem>
      ))}
    </List>
  );
};

export default TMDBResults;
