// features/browse/hooks/useDirectoryState.js
import { useState, useEffect, useCallback, useRef } from "react";

export function useDirectoryState(initialPath = "") {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [highlightedFilePath, setHighlightedFilePath] = useState(null);
  
  // Use a ref to track the current hover path without causing re-renders
  const currentHoverPath = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const handleFileClick = useCallback((file) => {
    setSelectedFile(file);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedFile(null);
  }, []);

  const handleFileHover = useCallback((filePath) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Update the ref immediately (no re-render)
    currentHoverPath.current = filePath;
    
    // Only update React state if it's different and after a small delay
    // This prevents rapid state updates during fast mouse movements
    hoverTimeoutRef.current = setTimeout(() => {
      if (currentHoverPath.current === filePath && highlightedFilePath !== filePath) {
        setHighlightedFilePath(filePath);
      }
    }, 50); // 50ms delay to debounce rapid hover events
  }, [highlightedFilePath]);

  const handleFileHoverLeave = useCallback(() => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Update the ref immediately (no re-render)
    currentHoverPath.current = null;
    
    // Clear React state after a short delay to allow for quick re-hovers
    hoverTimeoutRef.current = setTimeout(() => {
      if (currentHoverPath.current === null) {
        setHighlightedFilePath(null);
      }
    }, 100); // Slightly longer delay for leave to prevent flickering
  }, []);

  const handlePlanHover = useCallback((change) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    const filePath = change.before.path;
    currentHoverPath.current = filePath;
    
    // For plan hover, update immediately since these are less frequent
    setHighlightedFilePath(filePath);
  }, []);

  const handlePlanHoverLeave = useCallback(() => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    currentHoverPath.current = null;
    setHighlightedFilePath(null);
  }, []);

  useEffect(() => {
    setHighlightedFilePath(null);
    currentHoverPath.current = null;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, [plan]);

  return {
    currentPath, setCurrentPath,
    files, setFiles,
    plan, setPlan,
    loading, setLoading,
    modalOpen, selectedFile,
    highlightedFilePath,
    handleFileClick,
    handleCloseModal,
    handleFileHover,
    handleFileHoverLeave,
    handlePlanHover,
    handlePlanHoverLeave,
  };
}
