// Hero portrait as an interactive glass object (canvasui.dev's glass-object,
// vendored — see glass-object.js) instead of a flat photo: a bust-with-a-cap
// silhouette (images/hero-glass-bust.svg) extruded into physically-based
// glass, refracting the headshot behind it. Sits above the hero-bg
// canvas/orbs layer. Falls back to the plain <img> if WebGL is unavailable
// or the module fails to load.
import { createGlassObject } from "./glass-object.js";

const canvas = document.querySelector(".hero-glass-canvas");
const fallback = document.querySelector(".hero-image");
if (canvas) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#C8F542";

    const instance = createGlassObject(
        { canvas },
        {
            src: "images/hero-glass-bust.svg",
            backgroundImage: "images/mark-jenkins.jpg",
            depth: 0.25,
            bevel: 0.45,
            ior: 1.6,
            tint: accent,
            tintDensity: 1,
            highlight: accent,
            scale: 2.4,
            cameraDistance: 4.5,
            floatIntensity: 0.8,
            rotationIntensity: 0.8,
            floatSpeed: 1.2,
            orbit: true,
            zoom: false,
            autoRotate: true,
            autoRotateSpeed: 0.8,
            onLoad: () => fallback?.classList.add("hero-image-behind-glass"),
        },
    );

    if (instance) {
        window.addEventListener("resize", () => instance.resize());
    }
}
