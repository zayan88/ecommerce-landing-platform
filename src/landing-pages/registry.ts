import React from "react";
import { Product, LandingPage } from "@/types";
import StarterLandingPage from "./starter-template/page";
import MeshNebulizerLandingPage from "./mesh-nebulizer/page";
import MassageCushionLandingPage from "./massage-cushion/page";
import BodyMassagerLandingPage from "./body-massager/page";
import CarOrganizerLandingPage from "./car-organizer/page";
import AstroBeamLandingPage from "./astrobeam/page";

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
  // Product 1: Mesh Nebulizer
  "mesh-nebulizer": MeshNebulizerLandingPage,
  "portable-nebulizer": MeshNebulizerLandingPage,
  "safka-8ftidwr": MeshNebulizerLandingPage,

  // Product 2: Body Massager 5x1 (Replacing Massage Cushion as requested)
  "body-massager": BodyMassagerLandingPage,
  "body-massager-5in1": BodyMassagerLandingPage,
  "safka-7mebpwu": BodyMassagerLandingPage,
  "starter-template": BodyMassagerLandingPage,
  "safka-b5fb3b6b": BodyMassagerLandingPage,
  "rexrack-massage-gun": BodyMassagerLandingPage,
  "massage-cushion": BodyMassagerLandingPage,
  "heating-massage-cushion": BodyMassagerLandingPage,
  "cushion-rxuirx2": BodyMassagerLandingPage,
  "safka-rxuirx2": BodyMassagerLandingPage,
  "safka-6726c6a0": BodyMassagerLandingPage,

  // Product 3: Car Organizer
  "car-organizer": CarOrganizerLandingPage,
  "car-seat-organizer": CarOrganizerLandingPage,
  "safka-9pkjp8q": CarOrganizerLandingPage,
  "safka-6a29f09b": CarOrganizerLandingPage,

  // Product 4: AstroBeam Mini Space Projector
  "astrobeam": AstroBeamLandingPage,
  "astrobeam-projector": AstroBeamLandingPage,
  "safka-6ab19443": AstroBeamLandingPage,
  "safka-6ab19443ca38d5013c7cb9fb": AstroBeamLandingPage,
};

/**
 * Resolves a landing page component by key or fallback to the starter-template component.
 */
export function getLandingPageComponent(componentKey: string) {
  return landingPageRegistry[componentKey] || landingPageRegistry["starter-template"] || null;
}
