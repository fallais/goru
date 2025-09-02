import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History,
  Refresh,
  Undo,
  UndoOutlined,
  CheckCircle,
  Cancel,
  Info,
  Delete,
  Warning,
} from '@mui/icons-material';
import { useApiCall } from '../hooks/useApiCall';

function State() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertMode, setRevertMode] = useState('last'); // 'last', 'all', 'id'
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [reverting, setReverting] = useState(false);
  const { get, post } = useApiCall();

  const fetchState = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeOnly) {
      params.append('active', 'true');
    }
    
    const result = await get(`/api/state?${params.toString()}`, {
      errorPrefix: 'Failed to fetch state'
    });
    
    if (result.success) {
      setState(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchState();
  }, [activeOnly]);

  const handleRevert = async () => {
    setReverting(true);
    
    let revertData = {};
    if (revertMode === 'last') {
      revertData = { last: true };
    } else if (revertMode === 'all') {
      revertData = { all: true };
    } else if (revertMode === 'id' && selectedEntryId) {
      revertData = { id: selectedEntryId };
    }
    
    const result = await post('/api/state/revert', revertData, {
      errorPrefix: 'Failed to revert',
      successMessage: 'Revert operation completed',
      showSuccessNotification: true
    });
    
    if (result.success) {
      setRevertDialogOpen(false);
      fetchState(); // Refresh the state
    }
    
    setReverting(false);
  };

  const openRevertDialog = (mode, entryId = '') => {
    setRevertMode(mode);
    setSelectedEntryId(entryId);
    setRevertDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (entry) => {
    if (entry.reverted) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Reverted"
          color="success"
          size="small"
        />
      );
    }
    return (
      <Chip
        icon={<Info />}
        label="Active"
        color="primary"
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!state) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          State Management
        </Typography>
        <Alert severity="error">Failed to load state information</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          State Management
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
            }
            label="Show active only"
            sx={{ mr: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchState}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          {state.active_count > 0 && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<UndoOutlined />}
                onClick={() => openRevertDialog('last')}
                sx={{ mr: 1 }}
              >
                Revert Last
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Undo />}
                onClick={() => openRevertDialog('all')}
              >
                Revert All
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Operations
              </Typography>
              <Typography variant="h4" component="div">
                {state.total_count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Operations
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {state.active_count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Reverted Operations
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {state.total_count - state.active_count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operations List */}
      <Paper sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Rename Operations {activeOnly ? '(Active Only)' : ''}
          </Typography>
        </Box>
        
        {state.entries.length === 0 ? (
          <Box p={4} textAlign="center">
            <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No operations found
            </Typography>
            <Typography color="textSecondary">
              {activeOnly 
                ? 'No active rename operations to show'
                : 'No rename operations have been performed yet'
              }
            </Typography>
          </Box>
        ) : (
          <List>
            {state.entries.map((entry, index) => (
              <React.Fragment key={entry.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: entry.reverted ? 'grey.50' : 'background.paper',
                    opacity: entry.reverted ? 0.7 : 1
                  }}
                >
                  <ListItemIcon sx={{ mt: 1 }}>
                    {entry.reverted ? (
                      <CheckCircle color="success" />
                    ) : (
                      <History color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" component="span">
                          {entry.original_name} → {entry.new_name}
                        </Typography>
                        {getStatusChip(entry)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          <strong>From:</strong> {entry.original_path}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>To:</strong> {entry.new_path}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Date:</strong> {formatDate(entry.timestamp)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          <strong>ID:</strong> {entry.id}
                        </Typography>
                      </Box>
                    }
                  />
                  {!entry.reverted && (
                    <Box display="flex" alignItems="center" ml={2}>
                      <Tooltip title="Revert this operation">
                        <IconButton
                          color="warning"
                          onClick={() => openRevertDialog('id', entry.id)}
                        >
                          <Undo />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </ListItem>
                {index < state.entries.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Revert Dialog */}
      <Dialog open={revertDialogOpen} onClose={() => setRevertDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Warning color="warning" sx={{ mr: 1 }} />
            Confirm Revert Operation
          </Box>
        </DialogTitle>
        <DialogContent>
          {revertMode === 'last' && (
            <Typography>
              This will revert the most recent active rename operation. The file will be renamed back to its original name.
            </Typography>
          )}
          {revertMode === 'all' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography>
                This will revert ALL {state.active_count} active rename operations. This action cannot be undone.
              </Typography>
            </Alert>
          )}
          {revertMode === 'id' && (
            <Typography>
              This will revert the selected rename operation. The file will be renamed back to its original name.
              <br /><br />
              <strong>Operation ID:</strong> {selectedEntryId}
            </Typography>
          )}
          <Typography sx={{ mt: 2 }} color="textSecondary">
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevertDialogOpen(false)} disabled={reverting}>
            Cancel
          </Button>
          <Button
            onClick={handleRevert}
            color="warning"
            variant="contained"
            disabled={reverting}
            startIcon={reverting ? <CircularProgress size={16} /> : <Undo />}
          >
            {reverting ? 'Reverting...' : 'Revert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default State;
