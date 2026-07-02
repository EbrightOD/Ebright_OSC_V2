"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextValue {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  items: [],
  setItems: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

/** Call this in any client component to set the header breadcrumb for that page. */
export function useBreadcrumb(items: BreadcrumbItem[]) {
  const { setItems } = useContext(BreadcrumbContext);
  // Serialize once to avoid re-running when the inline array reference changes each render
  const key = JSON.stringify(items);
  useEffect(() => {
    setItems(JSON.parse(key));
    return () => setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
