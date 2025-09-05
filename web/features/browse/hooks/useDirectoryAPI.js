// features/browse/hooks/useDirectoryAPI.js
import { getDirectory, getDefaultDirectory, createPlan, applyPlan } from "@/lib/api";

export function useDirectoryAPI() {
  const loadDefaultDirectory = async () => {
    const defaultPath = await getDefaultDirectory();
    return defaultPath;
  };

  const loadDirectory = async (path) => {
    const result = await getDirectory({ path });
    return {
      path: result.data?.path || result.path || path,
      files: result.data?.files || result.files || result || [],
    };
  };

  const lookupPlan = async ({ currentPath, settings }) => {
    const result = await createPlan({
      directory: currentPath,
      type: settings.mediaType || 'auto',
      provider: settings.provider || 'tmdb',
      recursive: settings.recursive ?? true,
    });

    if (result?.data?.plan) return result.data.plan;
    if (result?.plan) return result.plan;
    return result;
  };

  const applyPlanChanges = async (planId) => {
    return applyPlan({ planId, options: {} });
  };

  return { loadDefaultDirectory, loadDirectory, lookupPlan, applyPlanChanges };
}
