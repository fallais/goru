import React from 'react';
import {
  Modal,
  Backdrop,
  Fade,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import {
  Close,
  Info,
} from '@mui/icons-material';
import { formatFileSize, getFileExtension, getActionInfo } from '../../utils/fileUtils';

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  modTime?: string;
}

interface PlanChange {
  before: {
    path: string;
    filename: string;
  };
  after: {
    path: string;
    filename: string;
  };
  action: number;
  conflict_ids?: string[];
}

interface Plan {
  changes: PlanChange[];
}

interface FileInfoModalProps {
  open: boolean;
  file?: FileItem | null;
  plan?: Plan | null;
  onClose: () => void;
}

function FileInfoModal({ open, file, plan, onClose }: FileInfoModalProps): React.JSX.Element | null {
  if (!file) return null;

  const change = plan?.changes?.find(c => c.before.path === file.path);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600 },
          maxHeight: '80vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="primary" />
              File Information
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    File Name
                  </TableCell>
                  <TableCell>{file.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Full Path
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
                    {file.path}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    File Type
                  </TableCell>
                  <TableCell>
                    {file.isDir ? 'Directory' : getFileExtension(file.name)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Size
                  </TableCell>
                  <TableCell>
                    {file.isDir ? 'N/A' : formatFileSize(file.size)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Last Modified
                  </TableCell>
                  <TableCell>{file.modTime}</TableCell>
                </TableRow>
                {change && (
                  <>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Planned Action
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getActionInfo(change.action).label}
                          size="small"
                          color={getActionInfo(change.action).color as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                        />
                      </TableCell>
                    </TableRow>
                    {change.after && change.before.filename !== change.after.filename && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          New Name
                        </TableCell>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          {change.after.filename}
                        </TableCell>
                      </TableRow>
                    )}
                    {change.conflict_ids && change.conflict_ids.length > 0 && (
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                          Conflicts
                        </TableCell>
                        <TableCell>
                          <Chip label="CONFLICT DETECTED" size="small" color="error" />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="contained">
              Close
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

export default FileInfoModal;
