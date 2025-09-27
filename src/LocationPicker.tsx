import React, { useCallback, useEffect, useRef, useState } from "react";
import loadGoogleMaps from "./utils/loadGoogleMaps";
import { LocationState, Stop } from "./types/location";
import LocationPanel from "./components/LocationPanel";

export default function LocationPicker() {
  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const fromSearchRef = useRef<HTMLInputElement | null>(null);
  const toSearchRef = useRef<HTMLInputElement | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [fromLocation, setFromLocation] = useState<LocationState>({
    city: "",
    busStops: [],
    selectedStop: null,
    searchInput: "",
    filteredStops: [],
    currentLocation: null,
    searchLocation: null,
    suggestions: [],
    showSuggestions: false,
  });
  const [toLocation, setToLocation] = useState<LocationState>({
    city: "",
    busStops: [],
    selectedStop: null,
    searchInput: "",
    filteredStops: [],
    currentLocation: null,
    searchLocation: null,
    suggestions: [],
    showSuggestions: false,
  });
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load maps + init map
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current) return;
        const m = new google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.209 }, // default (Delhi)
          zoom: 12,
        });
        setMap(m);
      })
      .catch((error) => {
        console.error("Failed to initialize Google Maps:", error);
        alert(
          "Failed to load maps. Please check your internet connection and try again."
        );
      });
  }, []);

  // Helper: clear markers
  const clearMarkers = useCallback(() => {
    markers.forEach((mk) => mk.setMap(null));
    setMarkers([]);
  }, [markers]);

  // Search for location suggestions
  const searchLocationSuggestions = useCallback(
    (query: string, target: "from" | "to") => {
      if (!query.trim() || !map) return;

      const service = new google.maps.places.PlacesService(map);
      const request = {
        query: query,
        fields: ["name", "formatted_address", "geometry", "place_id"],
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const updateState =
            target === "from" ? setFromLocation : setToLocation;
          updateState((prev) => ({
            ...prev,
            suggestions: results.slice(0, 5), // Limit to 5 suggestions
            showSuggestions: true,
          }));
        }
      });
    },
    [map]
  );

  // Find nearest bus stops
  const findNearestStops = useCallback(
    (latlng: google.maps.LatLngLiteral, maxResults = 8, radius = 2000) =>
    new Promise<Stop[]>((resolve) => {
        const service = new google.maps.places.PlacesService(
          map ?? document.createElement("div")
        );
      service.nearbySearch(
        { location: latlng, radius, type: "bus_station" },
        (results, status) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results?.length
            ) {
            // Fallback to transit_station
            service.nearbySearch(
              { location: latlng, radius, type: "transit_station" },
              (fallbackResults, fallbackStatus) => {
                  if (
                    fallbackStatus !==
                      google.maps.places.PlacesServiceStatus.OK ||
                    !fallbackResults?.length
                  ) {
                  return resolve([]);
                }
                const arr = fallbackResults
                  .map((r) => ({
                    name: r.name ?? "Transit Station",
                    address: r.vicinity,
                      location: {
                        lat: r.geometry!.location!.lat(),
                        lng: r.geometry!.location!.lng(),
                      },
                      distance:
                        Math.sqrt(
                          Math.pow(
                            r.geometry!.location!.lat() - latlng.lat,
                            2
                          ) +
                            Math.pow(
                              r.geometry!.location!.lng() - latlng.lng,
                              2
                            )
                    ) * 111, // Rough conversion to km
                  }))
                  .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                  .slice(0, maxResults);
                resolve(arr);
              }
            );
            return;
          }
          
          const arr = results
            .map((r) => ({
              name: r.name ?? "Bus Stop",
              address: r.vicinity,
                location: {
                  lat: r.geometry!.location!.lat(),
                  lng: r.geometry!.location!.lng(),
                },
                distance:
                  Math.sqrt(
                Math.pow(r.geometry!.location!.lat() - latlng.lat, 2) +
                Math.pow(r.geometry!.location!.lng() - latlng.lng, 2)
              ) * 111, // Rough conversion to km
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .slice(0, maxResults);
          resolve(arr);
        }
      );
      }),
    [map]
  );

  // Handle suggestion selection
  const handleSuggestionSelection = async (
    target: "from" | "to",
    suggestion: google.maps.places.PlaceResult
  ) => {
    if (!suggestion.geometry?.location) return;

    const location = {
      lat: suggestion.geometry.location.lat(),
      lng: suggestion.geometry.location.lng(),
    };

    // console.log("$$$$$$$",suggestion.geometry?.location)

    const updateState = target === "from" ? setFromLocation : setToLocation;

    // Update search input and hide suggestions
    updateState((prev) => ({
      ...prev,
      searchInput: suggestion.formatted_address || suggestion.name || "",
      suggestions: [],
      showSuggestions: false,
    }));

    console.log(target, location);
    // Apply the location filter
    await handleSearchLocationSelection(target, location);
  };

  // Handle city selection (from/to)
  const handleCitySelection = useCallback(
    async (
      target: "from" | "to",
      location: google.maps.LatLngLiteral,
      cityName: string
    ) => {
    const stops = await findNearestStops(location);
    const updateState = target === "from" ? setFromLocation : setToLocation;
    
      updateState((prev) => ({
      ...prev,
      city: cityName,
      busStops: stops,
      filteredStops: stops,
      selectedStop: stops[0] || null,
      currentLocation: location,
      searchLocation: null,
      searchInput: "",
        suggestions: [],
        showSuggestions: false,
    }));

    // Update map
    clearMarkers();
    if (stops.length > 0) {
        const newMarkers = stops.map(
          (s) =>
        new google.maps.Marker({ 
          position: s.location, 
          map, 
          title: s.name,
          icon: {
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">🚌</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
              },
        })
      );
      setMarkers(newMarkers);
      map?.panTo(stops[0].location);
    }
    },
    [map, findNearestStops, clearMarkers]
  );

  // Handle bus stop selection
  const handleStopSelection = (target: "from" | "to", stop: Stop) => {
    const updateState = target === "from" ? setFromLocation : setToLocation;
    updateState((prev) => ({
      ...prev,
      selectedStop: stop,
    }));

    // Update map to show selected stop
    clearMarkers();
    const marker = new google.maps.Marker({
      position: stop.location,
      map,
      title: stop.name,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EA4335" stroke="white" stroke-width="3"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚌</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
      },
    });
    setMarkers([marker]);
    map?.panTo(stop.location);
  };

  // Handle search location selection (when user selects from autocomplete)
  const handleSearchLocationSelection = async (
    target: "from" | "to",
    location: google.maps.LatLngLiteral
  ) => {
    const updateState = target === "from" ? setFromLocation : setToLocation;
    const currentState = target === "from" ? fromLocation : toLocation;
    
    // Find bus stops near the searched location
    const nearbyStops = await findNearestStops(location, 10, 4000); // Increased radius and results for better coverage

    // Combine existing bus stops with newly found ones, removing duplicates
    const combinedStops = [...currentState.busStops];
    nearbyStops.forEach((nearbyStop) => {
      const exists = combinedStops.some(
        (stop) =>
          Math.abs(stop.location.lat - nearbyStop.location.lat) < 0.001 &&
          Math.abs(stop.location.lng - nearbyStop.location.lng) < 0.001
      );
      if (!exists) {
        combinedStops.push(nearbyStop);
      }
    });

    // Update all stops with distance from search location and sort by proximity
    const updatedStops = combinedStops
      .map((stop) => {
        const distance =
          Math.sqrt(
        Math.pow(stop.location.lat - location.lat, 2) +
        Math.pow(stop.location.lng - location.lng, 2)
      ) * 111; // Rough conversion to km
      return { ...stop, distance };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 15); // Limit to top 15 nearest stops

    updateState((prev) => ({
      ...prev,
      searchLocation: location,
      filteredStops: updatedStops,
      selectedStop: updatedStops[0] || null,
      busStops: combinedStops,
    }));

    // Update map with search location marker and bus stops
    clearMarkers();
    const markers: google.maps.Marker[] = [];

    // Add search location marker
    const searchMarker = new google.maps.Marker({
      position: location,
      map,
      title: "Search Location",
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#FF6B6B" stroke="white" stroke-width="3"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
      },
    });
    markers.push(searchMarker);

    // Add bus stop markers
    if (updatedStops.length > 0) {
      const busStopMarkers = updatedStops.slice(0, 8).map(
        (
          s,
          index // Show only top 8 on map to avoid clutter
        ) =>
        new google.maps.Marker({ 
          position: s.location, 
          map, 
            title: `${s.name} (${s.distance?.toFixed(1)} km)`,
          icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="${
                  index === 0 ? "#4CAF50" : "#4285F4"
                }" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">🚌</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            },
          })
      );
      markers.push(...busStopMarkers);

      // Set map bounds to include search location and nearest stops
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(location);
      updatedStops.slice(0, 5).forEach((stop) => bounds.extend(stop.location));
      map?.fitBounds(bounds);
    }

    setMarkers(markers);
  };

  // Handle current location
  const handleCurrentLocation = async (target: "from" | "to") => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const currentState = target === "from" ? fromLocation : toLocation;
        
        // If no city is selected, use current location for city selection
        if (!currentState.city) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: latlng }, async (res) => {
            const cityName =
              res?.[0]?.address_components?.find(
                (comp) =>
                  comp.types.includes("locality") ||
                  comp.types.includes("administrative_area_level_1")
            )?.long_name || "Current Location";
            
            await handleCitySelection(target, latlng, cityName);
          });
        } else {
          // If city is already selected, filter bus stops by current location
          await handleSearchLocationSelection(target, latlng);
        }
      },
      (err) => alert("Location denied / error: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  // Attach autocomplete to city inputs
  useEffect(() => {
    if (!map || !window.google) return;
    
    const attachAuto = (
      input: HTMLInputElement | null,
      onPick: (loc: google.maps.LatLngLiteral, name: string) => void
    ) => {
      if (!input) return;
      const ac = new google.maps.places.Autocomplete(input, { 
        fields: ["geometry", "formatted_address", "name", "address_components"], 
        types: ["(cities)"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const loc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        const cityName =
          place.name || place.formatted_address || "Selected City";
        onPick(loc, cityName);
      });
    };
    
    attachAuto(fromRef.current, (loc, name) =>
      handleCitySelection("from", loc, name)
    );
    attachAuto(toRef.current, (loc, name) =>
      handleCitySelection("to", loc, name)
    );
  }, [map, handleCitySelection]);

  // Handle search input changes with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (fromLocation.searchInput.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocationSuggestions(fromLocation.searchInput, "from");
      }, 300);
    } else {
      setFromLocation((prev) => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
      }));
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fromLocation.searchInput, searchLocationSuggestions]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (toLocation.searchInput.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocationSuggestions(toLocation.searchInput, "to");
      }, 300);
    } else {
      setToLocation((prev) => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
      }));
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [toLocation.searchInput, searchLocationSuggestions]);

  return (
    <div
      style={{ display: "flex", gap: 24, width: "100%", margin: "0", padding: 0, fontSize: "16px" }}
    >
      <LocationPanel
        title="From"
        cityInputRef={fromRef}
        searchInputRef={fromSearchRef}
        state={fromLocation}
        onClickCurrent={() => handleCurrentLocation("from")}
        onSearchInputChange={(value) =>
          setFromLocation((prev) => ({ ...prev, searchInput: value }))
        }
        onSelectSuggestion={(s) => handleSuggestionSelection("from", s)}
        onSelectStop={(stop) => handleStopSelection("from", stop)}
      />

      <LocationPanel
        title="To"
        cityInputRef={toRef}
        searchInputRef={toSearchRef}
        state={toLocation}
        onClickCurrent={() => handleCurrentLocation("to")}
        onSearchInputChange={(value) =>
          setToLocation((prev) => ({ ...prev, searchInput: value }))
        }
        onSelectSuggestion={(s) => handleSuggestionSelection("to", s)}
        onSelectStop={(stop) => handleStopSelection("to", stop)}
      />

      <div
        ref={mapRef}
        style={{
          height: 700,
          border: "1px solid var(--rb-border)",
          borderRadius: 12,
          flex: 1,
          minWidth: "400px",
          boxShadow: "var(--rb-shadow)",
        }}
      />
    </div>
  );
}
