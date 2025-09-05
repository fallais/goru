"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDefaultDirectory } from "@/lib/api/directory";
import { useNotification } from "./NotificationContext";

interface DefaultDirectoryContextValue {
  defaultDirectory: string | null;
  loading: boolean;
}

const DefaultDirectoryContext = createContext<DefaultDirectoryContextValue | undefined>(undefined);

export function DefaultDirectoryProvider({ children }: { children: ReactNode }) {
  const [defaultDirectory, setDefaultDirectory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    async function fetchDefaultDirectory() {
      setLoading(true);
      try {
        const dir = await getDefaultDirectory();
        setDefaultDirectory(dir);
      } catch (err: any) {
        console.error(err);
        showError(err.message || "Failed to load default directory");
      } finally {
        setLoading(false);
      }
    }

    fetchDefaultDirectory();
  }, []);

  return (
    <DefaultDirectoryContext.Provider value={{ defaultDirectory, loading }}>
      {children}
    </DefaultDirectoryContext.Provider>
  );
}

export function useDefaultDirectoryContext(): DefaultDirectoryContextValue {
  const context = useContext(DefaultDirectoryContext);
  if (!context) {
    throw new Error("useDefaultDirectoryContext must be used within DefaultDirectoryProvider");
  }
  return context;
}