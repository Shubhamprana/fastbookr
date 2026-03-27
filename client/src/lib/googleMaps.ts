const API_KEY =
  import.meta.env.VITE_FRONTEND_FORGE_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
let googleMapsPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (!API_KEY) {
    return Promise.reject(new Error("Map API key is missing"));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  }).catch(error => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise as Promise<void>;
}
