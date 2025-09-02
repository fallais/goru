// Utility functions for file operations

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toUpperCase();
};

// Map action numbers to labels and chip colors
export const getActionInfo = (action) => {
  switch (action) {
    case 126: // rename
      return { label: 'Rename', color: 'warning' };
    case 200: // already correct (example)
      return { label: 'Already correct', color: 'success' };
    case 300: // skip (example)
      return { label: 'Skip', color: 'error' };
    default:
      return { label: 'Action', color: 'primary' };
  }
};

// Check if file is a video file
export const isVideoFile = (filename) => {
  const videoExtensions = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', 
    '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ogv'
  ];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Categorize files
export const categorizeFiles = (files) => {
  const videoFiles = files.filter(file => !file.isDir && isVideoFile(file.name));
  const directories = files.filter(file => file.isDir);
  const otherFiles = files.filter(file => !file.isDir && !isVideoFile(file.name));

  return { videoFiles, directories, otherFiles };
};

// Create changes map for quick lookup
export const createChangesMap = (plan) => {
  const changesByPath = {};
  if (plan && plan.changes) {
    plan.changes.forEach(change => {
      changesByPath[change.before.path] = change;
    });
  }
  return changesByPath;
};
