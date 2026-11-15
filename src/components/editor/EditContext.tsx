"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { LandingPageContentConfig } from "@/types";

/** What the merchant currently has selected on the canvas. */
export interface EditSelection {
  field: string;
  kind: "text" | "image";
  /** Value as displayed on the page (includes fallback/default text). */
  value: string;
  /** Resolved array root (for indexed paths) so a first edit materialises the whole visible array. */
  base?: unknown;
  multiline?: boolean;
}

export interface EditContextValue {
  editMode: boolean;
  content: LandingPageContentConfig;
  /** `base` = the fully resolved value of the path's root key (e.g. the visible bullets array). */
  setField: (path: string, value: unknown, base?: unknown) => void;
  selected: EditSelection | null;
  select: (sel: EditSelection | null) => void;
}

const noop = () => {};

/** Without a provider (public site) everything behaves as plain rendering. */
const DEFAULT_CTX: EditContextValue = {
  editMode: false,
  content: {},
  setField: noop,
  selected: null,
  select: noop,
};

const EditCtx = createContext<EditContextValue>(DEFAULT_CTX);

export function useEdit(): EditContextValue {
  return useContext(EditCtx);
}

interface EditProviderProps {
  content: LandingPageContentConfig;
  setField: EditContextValue["setField"];
  selected: EditSelection | null;
  select: EditContextValue["select"];
  children: React.ReactNode;
}

export function EditProvider({ content, setField, selected, select, children }: EditProviderProps) {
  const value = useMemo<EditContextValue>(
    () => ({ editMode: true, content, setField, selected, select }),
    [content, setField, selected, select]
  );
  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>;
}

const isIndex = (k: string) => /^\d+$/.test(k);

export function getByPath(obj: unknown, path: string): any {
  let cur: any = obj;
  for (const k of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

/**
 * Immutable set by dot path ("hero_bullets.0", "reviews.2.text"). Arrays are copied, missing
 * containers are created (array when the next key is numeric, object otherwise).
 */
export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const walk = (cur: any, i: number): any => {
    const key = keys[i];
    const container: any = Array.isArray(cur)
      ? [...cur]
      : cur && typeof cur === "object"
      ? { ...cur }
      : isIndex(key)
      ? []
      : {};
    container[isIndex(key) && Array.isArray(container) ? Number(key) : key] =
      i === keys.length - 1 ? value : walk(container[key], i + 1);
    return container;
  };
  return walk(obj, 0) as T;
}

/** Applies a field edit to a content object, seeding the path's root from `base` when given. */
export function applyFieldEdit(
  content: LandingPageContentConfig,
  path: string,
  value: unknown,
  base?: unknown
): LandingPageContentConfig {
  let next: any = content || {};
  if (base !== undefined && path.includes(".")) {
    const root = path.split(".")[0];
    next = { ...next, [root]: JSON.parse(JSON.stringify(base)) };
  }
  return setByPath(next, path, value);
}
