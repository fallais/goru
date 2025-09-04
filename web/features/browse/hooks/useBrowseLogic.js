// features/browse/hooks/useBrowseLogic.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useNotification } from "@/contexts/NotificationContext";
import { useDirectory } from "@/contexts/DirectoryContext";
import { useDirectoryAPI } from "./useDirectoryAPI";
import { useDirectoryState } from "./useDirectoryState";

export function useBrowseLogic() {
  const router = useRouter();
  const { showError, showSuccess } = useNotification();
  const { selectDirectory } = useDirectory();
  const api = useDirectoryAPI();
  const state = useDirectoryState();

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
    state.setLoading(true);
    try {
      const defaultPath = await api.loadDefaultDirectory();
      console.log('Default directory API response:', defaultPath);
      
      if (defaultPath && typeof defaultPath === 'string') {
        await loadDirectory(defaultPath);
      } else {
        console.error('Invalid default path:', defaultPath);
        state.setCurrentPath("");
        state.setFiles([]);
      }
    } catch (e) {
      console.error('Failed to get default directory:', e);
      showError("Failed to get default directory");
      state.setCurrentPath("");
      state.setFiles([]);
    }
    state.setLoading(false);
  };

  const loadDirectory = async (path) => {
    state.setLoading(true);
    state.setFiles([]);
    state.setPlan(null);

    try {
      const result = await api.loadDirectory(path);
      console.log('Directory API response:', result);
      state.setCurrentPath(result.path);
      state.setFiles(result.files);
    } catch (e) {
      console.error('Failed to load directory:', e);
      showError("Failed to load directory");
    }

    state.setLoading(false);
  };

  const handleDirectoryClick = (dirPath) => {
    loadDirectory(dirPath);
  };

  const handleParentDirectory = () => {
    if (state.currentPath) {
      const parentPath = state.currentPath.substring(0, state.currentPath.lastIndexOf('\\'));
      if (parentPath && parentPath.length > 0) {
        loadDirectory(parentPath);
      }
    }
  };

  const handleLookup = async () => {
    if (!state.currentPath || !state.currentPath.trim()) {
      showError("No directory loaded");
      return;
    }
    state.setLoading(true);
    state.setPlan(null);

    try {
      const savedSettings = JSON.parse(localStorage.getItem("goname-settings") || "{}");
      const settings = { 
        mediaType: "auto", 
        provider: "tmdb", 
        recursive: true, 
        ...savedSettings 
      };
      const planData = await api.lookupPlan({ 
        currentPath: state.currentPath, 
        files: state.files, 
        settings 
      });
      state.setPlan(planData);
    } catch (e) {
      console.error('Failed to lookup media information:', e);
      showError("Failed to lookup media information");
    }

    state.setLoading(false);
  };

  const handleApply = async () => {
    if (!state.plan || !state.plan.changes || state.plan.changes.length === 0) {
      showError("No plan to apply");
      return;
    }
    state.setLoading(true);

    try {
      const result = await api.applyPlanChanges(state.plan.id || "current");
      console.log('Apply API response:', result);
      showSuccess("Changes applied successfully!");
      await loadDirectory(state.currentPath);
      state.setPlan(null);
    } catch (e) {
      console.error('Failed to apply changes:', e);
      showError("Failed to apply changes");
    }

    state.setLoading(false);
  };

  const handleEditLookup = () => {
    if (!state.currentPath || !state.currentPath.trim()) {
      showError("No directory selected");
      return;
    }
    const directoryName = state.currentPath.split(/[\\/]/).pop() || "Unknown Directory";
    selectDirectory({ name: directoryName, path: state.currentPath });
    router.push("/lookup");
  };

  const handleRefresh = () => {
    loadDirectory(state.currentPath);
  };

  return { 
    ...state, 
    loadCurrentDirectory, 
    loadDirectory,
    handleDirectoryClick,
    handleParentDirectory, 
    handleLookup, 
    handleApply, 
    handleEditLookup,
    handleRefresh
  };
}
