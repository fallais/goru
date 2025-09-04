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

  const lookupPlan = async ({ currentPath, files, settings }) => {
    const result = await createPlan({
      path: currentPath,
      files: files.map(f => f.path),
      options: settings,
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
