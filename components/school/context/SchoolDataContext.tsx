"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";

import { useSchoolData } from "../hooks/useSchoolData";

const SchoolDataContext = createContext<
  ReturnType<typeof useSchoolData> | undefined
>(undefined);

export function SchoolDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useSchoolData();

  return (
    <SchoolDataContext.Provider value={value}>
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolDataContext);

  if (!context) {
    throw new Error(
      "useSchool must be used inside SchoolDataProvider"
    );
  }

  return context;
}