import React from "react";
import { Product, LandingPage } from "@/types";
import StarterLandingPage from "./starter-template/page";

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
  "starter-template": StarterLandingPage,
};

/**
 * Resolves a landing page component by key or fallback to the first available component.
 */
export function getLandingPageComponent(componentKey: string) {
  return landingPageRegistry[componentKey] || landingPageRegistry["starter-template"] || null;
}
