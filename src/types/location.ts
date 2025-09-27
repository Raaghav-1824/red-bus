export type Stop = {
  name: string;
  address?: string;
  location: google.maps.LatLngLiteral;
  distance?: number;
};

export type LocationState = {
  city: string;
  busStops: Stop[];
  selectedStop: Stop | null;
  searchInput: string;
  filteredStops: Stop[];
  currentLocation: google.maps.LatLngLiteral | null;
  searchLocation: google.maps.LatLngLiteral | null;
  suggestions: google.maps.places.PlaceResult[];
  showSuggestions: boolean;
};



