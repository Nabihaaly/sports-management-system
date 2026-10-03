"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface SportsContextType {
  showsignin: boolean;
  setshowsignin: (showsignin: boolean) => void;
    showsignup: boolean;
  setshowsignup: (showsignin: boolean) => void;

  session: typeof authClient.$Infer.Session | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export function useSports() {
  const context = useContext(SportsContext);

  if (!context) {
    throw new Error("useSports must be used inside SportsProvider");
  }

  return context;
}


export function SportsProvider({ children }: { children: ReactNode }) {
  const [showsignin, setshowsignin] = useState<boolean>(false);
  const [showsignup, setshowsignup] = useState<boolean>(false);
  const { data: session, isPending } = authClient.useSession();

  return (
    <SportsContext.Provider value={{ 
        showsignin, setshowsignin,setshowsignup,showsignup,session,
        isLoggedIn: !!session?.user,
        isLoading: isPending,}}>
      {children}
    </SportsContext.Provider>
  );
}

