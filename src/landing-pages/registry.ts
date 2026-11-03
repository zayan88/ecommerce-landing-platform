import React from "react";
import { Product, LandingPage } from "@/types";
import PortableUrinalPage from "./portable-urinal/page";

export interface LandingPageComponentProps {
  product: Product;
  landingPage: LandingPage;
}

/**
 * LANDING PAGE REGISTRY
 * Maps component_key or slug to dedicated Landing Page implementations.
 * Adding a new landing page only requires exporting a component and adding it here.
 */
export const landingPageRegistry: Record<string, React.ComponentType<LandingPageComponentProps>> = {
  "portable-urinal": PortableUrinalPage,
};

/**
 * Resolves a landing page component by key or fallback to the first available component.
 */
export function getLandingPageComponent(componentKey: string) {
  return landingPageRegistry[componentKey] || null;
}
