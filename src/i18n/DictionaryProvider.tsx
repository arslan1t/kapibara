"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Dictionary } from "./dictionary";

const DictionaryContext = createContext<Dictionary | null>(null);

/**
 * Hands the active dictionary to client components.
 *
 * Server components import `getDictionary` directly; they know their locale
 * from the route. Client components cannot, and threading a dictionary through
 * every prop would be worse than a context. Only the active language crosses
 * the wire, which is the reason this is a provider rather than an import.
 */
export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) {
    throw new Error(
      "useDictionary must be used inside DictionaryProvider — it is mounted in app/[locale]/layout.tsx"
    );
  }
  return dictionary;
}
