import { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { getDirectory, applyPlan } from '@/lib/api';

export const useFileOperations = () => {
  const { showError, showSuccess } = useNotification();
  
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadDirectory = async (path) => {
    setLoadingFiles(true);
    
    try {
      const result = await getDirectory({ path });
      setFiles(result.data?.files || result.files || []);
    } catch (error) {
      console.error('Failed to load directory:', error);
      showError('Failed to load directory');
    }
    
    setLoadingFiles(false);
  };

  const selectFile = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      
      // Clean up filename for search
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const cleanName = nameWithoutExt
        .replace(/[\[\]()]/g, ' ') // Remove brackets and parentheses
        .replace(/\d{4}/g, '') // Remove years
        .replace(/\b(1080p|720p|480p|2160p|4K|HD|HDR|x264|x265|HEVC|BluRay|WEB|WEBRip|DVDRip)\b/gi, '') // Remove quality indicators
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      return cleanName;
    }
    return null;
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
  };

  const applyChanges = async (proposedChanges) => {
    if (!proposedChanges) {
      showError('No proposed changes to apply');
      return { success: false };
    }

    try {
      // Create a plan similar to the Browse component
      const plan = {
        id: 'file-operation',
        changes: [{
          path: proposedChanges.originalFile.path,
          oldName: proposedChanges.originalName,
          newName: proposedChanges.proposedName,
          action: 126 // rename action code
        }]
      };

      const result = await applyPlan({
        planId: plan.id,
        options: {}
      });

      showSuccess('File renamed successfully!');
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to apply changes:', error);
      showError('Failed to apply changes');
      return { success: false };
    }
  };

  return {
    files,
    loadingFiles,
    selectedFile,
    loadDirectory,
    selectFile,
    clearFileSelection,
    applyChanges,
  };
};
