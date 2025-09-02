
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Button,
} from '@mui/material';
import {
  Home,
  ArrowUpward,
  Refresh,
} from '@mui/icons-material';

function DirectoryBreadcrumbs({ 
  currentPath, 
  loading,
  onLoadCurrentDirectory, 
  onLoadDirectory, 
  onParentDirectory,
  onRefresh 
}) {
  if (!currentPath) return null;
  
  const parts = currentPath.split('\\').filter(part => part.length > 0);
  
  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { 
            e.preventDefault(); 
            onLoadCurrentDirectory(); 
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          const path = parts.slice(0, index + 1).join('\\');
          
          if (isLast) {
            return (
              <Typography key={index} color="text.primary">
                {part}
              </Typography>
            );
          }
          
          return (
            <Link
              key={index}
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onLoadDirectory(path);
              }}
            >
              {part}
            </Link>
          );
        })}
      </Breadcrumbs>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<ArrowUpward />}
          onClick={onParentDirectory}
          disabled={loading || !currentPath}
        >
          Parent
        </Button>
        <Button
          size="small"
          startIcon={<Refresh />}
          onClick={onRefresh}
          disabled={loading || !currentPath}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
}

export default DirectoryBreadcrumbs;
