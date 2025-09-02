import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApiCall } from '../hooks/useApiCall';
import { useNotification } from '../contexts/NotificationContext';
import { useDirectory } from '../contexts/DirectoryContext';

export function useBrowseLogic() {
  const router = useRouter();
  const apiCall = useApiCall();
  const { showError } = useNotification();
  const { selectDirectory } = useDirectory();
  
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load current directory on component mount
  useEffect(() => {
    loadCurrentDirectory();
  }, []);

  // Handle search path from App Bar
  useEffect(() => {
    if (router.query.path) {
      loadDirectory(router.query.path);
      // Clear the query parameter
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.path]);

  const loadCurrentDirectory = async () => {
    setLoading(true);
    
    // First get the default directory path
    const defaultResult = await apiCall.get('/api/directory/default', {
      errorPrefix: 'Failed to get default directory'
    });
    
    if (defaultResult.success) {
      console.log('Default directory API response:', defaultResult.data);
      // The API returns a plain string, not an object
      const defaultPath = defaultResult.data || '';
      
      if (defaultPath && typeof defaultPath === 'string') {
        // Then load the directory contents
        await loadDirectory(defaultPath);
      } else {
        console.error('Invalid default path:', defaultPath);
        setCurrentPath('');
        setFiles([]);
      }
    }
    
    setLoading(false);
  };

  const loadDirectory = async (path) => {
    setLoading(true);
    setFiles([]);
    setPlan(null); // Clear previous plan when navigating

    const result = await apiCall.get('/api/directory', {
      params: { path: path },
      errorPrefix: 'Failed to load directory'
    });

    if (result.success) {
      console.log('Directory API response:', result.data);
      setCurrentPath(result.data.data?.path || result.data.path || path || '');
      setFiles(result.data.data?.files || result.data.files || result.data || []);
    }
    
    setLoading(false);
  };

  const handleDirectoryClick = (dirPath) => {
    loadDirectory(dirPath);
  };

  const handleParentDirectory = () => {
    if (currentPath) {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
      if (parentPath && parentPath.length > 0) {
        loadDirectory(parentPath);
      }
    }
  };

  const handleLookup = async () => {
    if (!currentPath || !currentPath.trim()) {
      showError('No directory loaded');
      return;
    }

    setLoading(true);
    setPlan(null);

    // Get settings from localStorage
    const savedSettings = localStorage.getItem('goname-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      mediaType: 'auto',
      provider: 'tmdb',
      recursive: true
    };

    const result = await apiCall.post('/api/lookup', {
      directory: currentPath,
      type: settings.mediaType,
      provider: settings.provider,
      recursive: settings.recursive,
    }, {
      errorPrefix: 'Failed to lookup media information'
    });

    if (result.success) {
      console.log('Lookup API response:', result.data);
      
      // Handle different possible response structures
      let planData = null;
      if (result.data?.data?.plan) {
        planData = result.data.data.plan;
      } else if (result.data?.plan) {
        planData = result.data.plan;
      } else if (result.data) {
        // If the entire response is the plan data
        planData = result.data;
      }
      
      setPlan(planData);
    }
    
    setLoading(false);
  };

  const handleEditLookup = () => {
    if (!currentPath || !currentPath.trim()) {
      showError('No directory selected');
      return;
    }

    // Get the directory name from the path
    const directoryName = currentPath.split('\\').pop() || currentPath.split('/').pop() || 'Unknown Directory';
    
    // Store directory data in context
    selectDirectory({
      name: directoryName,
      path: currentPath
    });
    
    // Navigate to lookup page (no query parameters needed)
    router.push('/lookup');
  };

  const handleApply = async () => {
    if (!plan || !plan.changes || plan.changes.length === 0) {
      showError('No plan to apply');
      return;
    }

    setLoading(true);

    const result = await apiCall.post('/api/apply', {
      plan: plan,
    }, {
      errorPrefix: 'Failed to apply changes',
      successMessage: 'Changes applied successfully!',
      showSuccessNotification: true
    });

    if (result.success) {
      console.log('Apply API response:', result.data.data);
      // Refresh the directory to show the updated file names
      await loadDirectory(currentPath);
      setPlan(null); // Clear the plan after successful application
    }
    
    setLoading(false);
  };

  // Modal handlers
  const handleFileClick = (file) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  const handleRefresh = () => {
    loadDirectory(currentPath);
  };

  return {
    // State
    currentPath,
    files,
    plan,
    loading,
    modalOpen,
    selectedFile,
    
    // Handlers
    loadCurrentDirectory,
    loadDirectory,
    handleDirectoryClick,
    handleParentDirectory,
    handleLookup,
    handleEditLookup,
    handleApply,
    handleFileClick,
    handleCloseModal,
    handleRefresh,
  };
}
