
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import { VideoFile, Movie, Tv, CheckCircle } from '@mui/icons-material';

const ProposedChanges = ({ 
  selectedFile,
  selectedTmdbItem,
  proposedChanges,
  tmdbTab,
  onClearFile,
  onClearTmdb,
  onApplyChanges,
}) => {
  if (!selectedFile && !selectedTmdbItem && !proposedChanges) {
    return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Current Selection
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {selectedFile && (
          <Chip 
            icon={<VideoFile />} 
            label={`File: ${selectedFile.name}`} 
            color="primary" 
            variant="outlined"
            onDelete={onClearFile}
          />
        )}
        {selectedTmdbItem && (
          <Chip 
            icon={tmdbTab === 0 ? <Movie /> : <Tv />} 
            label={`TMDB: ${selectedTmdbItem.title || selectedTmdbItem.name}`} 
            color="secondary" 
            variant="outlined"
            onDelete={onClearTmdb}
          />
        )}
      </Stack>
      
      {proposedChanges && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Proposed Changes:</Typography>
            <Typography variant="body2">
              <strong>From:</strong> {proposedChanges.originalName}
            </Typography>
            <Typography variant="body2">
              <strong>To:</strong> {proposedChanges.proposedName}
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircle />}
            onClick={onApplyChanges}
          >
            Apply Changes
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ProposedChanges;
