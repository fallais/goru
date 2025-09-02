
import { Snackbar, Alert, Slide } from '@mui/material';
import { useNotification } from '../contexts/NotificationContext';

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const NotificationSnackbar = () => {
  const { notification, hideNotification } = useNotification();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    hideNotification();
  };

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={notification.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      TransitionComponent={SlideTransition}
      sx={{
        '& .MuiSnackbarContent-root': {
          minWidth: '300px',
        },
      }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.severity}
        variant="filled"
        sx={{
          width: '100%',
          boxShadow: 3,
        }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
