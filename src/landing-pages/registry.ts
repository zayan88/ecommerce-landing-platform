import React from "react";
import { Product, LandingPage } from "@/types";
import StarterLandingPage from "./starter-template/page";
import MeshNebulizerLandingPage from "./mesh-nebulizer/page";

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
  "safka-b5fb3b6b": StarterLandingPage,
  "rexrack-massage-gun": StarterLandingPage,
  "mesh-nebulizer": MeshNebulizerLandingPage,
  "portable-nebulizer": MeshNebulizerLandingPage,
  "safka-8ftidwr": MeshNebulizerLandingPage,
};

/**
 * Resolves a landing page component by key or fallback to the starter-template component.
 */
export function getLandingPageComponent(componentKey: string) {
  return landingPageRegistry[componentKey] || landingPageRegistry["starter-template"] || null;
}
