import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a location...",
  className = "",
  id,
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dummyMapRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // PlacesService needs a map or div element
        if (dummyMapRef.current) {
          placesServiceRef.current = new google.maps.places.PlacesService(dummyMapRef.current);
        }
        setIsLoaded(true);
      }
    };

    // Try immediately
    initServices();

    // Also try after a delay in case Maps API is still loading
    if (!isLoaded) {
      const timer = setTimeout(initServices, 1000);
      const timer2 = setTimeout(initServices, 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [isLoaded]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((input: string) => {
    if (!autocompleteServiceRef.current || input.length < 2) {
      setSuggestions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input,
        types: ["geocode", "establishment"],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
  }, [onChange, fetchSuggestions]);

  const handleSelectPlace = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["formatted_address", "geometry", "address_components"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          let city = "";
          let state = "";
          let zipCode = "";

          place.address_components?.forEach((component) => {
            if (component.types.includes("locality")) {
              city = component.long_name;
            }
            if (component.types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (component.types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          });

          const result: PlaceResult = {
            address: place.formatted_address || prediction.description,
            city,
            state,
            zipCode,
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            placeId: prediction.place_id,
          };

          onChange(result.address);
          onPlaceSelect(result);
          setShowSuggestions(false);
          setSuggestions([]);
        }
      }
    );
  }, [onChange, onPlaceSelect]);

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden div for PlacesService */}
      <div ref={dummyMapRef} style={{ display: "none" }} />
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={`pl-9 ${className}`}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition-colors"
              onClick={() => handleSelectPlace(prediction)}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-muted-foreground bg-gray-50 flex items-center gap-1">
            <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" className="h-3" />
          </div>
        </div>
      )}
    </div>
  );
}
