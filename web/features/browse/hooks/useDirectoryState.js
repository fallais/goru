// features/browse/hooks/useDirectoryState.js
import { useState, useEffect } from "react";

export function useDirectoryState(initialPath = "") {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [highlightedFilePath, setHighlightedFilePath] = useState(null);

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileHover = (filePath) => setHighlightedFilePath(filePath);
  const handleFileHoverLeave = () => setHighlightedFilePath(null);
  const handlePlanHover = (change) => setHighlightedFilePath(change.before.path);
  const handlePlanHoverLeave = () => setHighlightedFilePath(null);

  useEffect(() => {
    setHighlightedFilePath(null);
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
