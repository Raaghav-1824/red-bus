import React from "react";
import { LocationState, Stop } from "../types/location";

type Props = {
  title: string;
  cityInputRef: React.RefObject<HTMLInputElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  state: LocationState;
  onClickCurrent: () => void;
  onSearchInputChange: (value: string) => void;
  onSelectSuggestion: (suggestion: google.maps.places.PlaceResult) => void;
  onSelectStop: (stop: Stop) => void;
};

export default function LocationPanel({
  title,
  cityInputRef,
  searchInputRef,
  state,
  onClickCurrent,
  onSearchInputChange,
  onSelectSuggestion,
  onSelectStop,
}: Props) {
  return (
    <div
      style={{
        border: "1px solid var(--rb-border)",
        borderRadius: 12,
        padding: 24,
        flex: 1.2,
        minWidth: "450px",
        backgroundColor: "var(--rb-card)",
        boxShadow: "var(--rb-shadow)",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "24px", fontWeight: 600 }}>{title}</h3>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "18px",
                color: "#555",
                minWidth: "60px",
              }}
            >
              City:
            </label>
            <input
              ref={cityInputRef}
              placeholder={title === "From" ? "Enter departure city" : "Enter destination city"}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "2px solid var(--rb-border)",
                borderRadius: 10,
                fontSize: "16px",
                transition: "border-color 0.3s",
              }}
            />
          </div>

          {state.busStops.length > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <button onClick={onClickCurrent} className="rb-btn rb-btn-primary">
                  📍 {title === "From" ? "Current" : " Current"}
                </button>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    ref={searchInputRef}
                    value={state.searchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                    onFocus={() => {
                      /* show suggestions handled by parent state */
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        /* hide handled by parent */
                      }, 200);
                    }}
                    placeholder="Search for a specific location..."
                    className="rb-input"
                  />
                  {state.showSuggestions && state.suggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid var(--rb-border)",
                        borderTop: "none",
                        borderRadius: "0 0 4px 4px",
                        maxHeight: 200,
                        overflowY: "auto",
                        zIndex: 1000,
                        boxShadow: "var(--rb-shadow)",
                      }}
                    >
                      {state.suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.place_id || index}
                          onClick={() => onSelectSuggestion(suggestion)}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: index < state.suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                            backgroundColor: "white",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                        >
                          <div style={{ fontWeight: 600, fontSize: "16px", color: "#333" }}>{suggestion.name}</div>
                          <div style={{ fontSize: "14px", color: "#666", marginTop: "2px" }}>{suggestion.formatted_address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: "14px", color: "#666", fontStyle: "italic", marginTop: "8px" }}>
                {state.searchLocation ? "✓ Filtering by searched location" : "📍 Showing all bus stops in city"}
              </div>
            </div>
          )}
        </div>

        {state.busStops.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: "12px", fontWeight: 600, fontSize: "18px", color: "#555" }}
            >
              🚌 Bus Stops in {state.city}
            </label>
            <div
              style={{
                maxHeight: 420,
                overflowY: "auto",
                border: "1px solid var(--rb-border)",
                borderRadius: 12,
                backgroundColor: "white",
              }}
            >
              {state.filteredStops.map((stop, index) => (
                <div
                  key={index}
                  onClick={() => onSelectStop(stop)}
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    backgroundColor: state.selectedStop?.name === stop.name ? "#fff5f5" : "white",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (state.selectedStop?.name !== stop.name) {
                      e.currentTarget.style.backgroundColor = "#fafafa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (state.selectedStop?.name !== stop.name) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "16px", color: "#333" }}>{stop.name}</div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>{stop.address}</div>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      fontWeight: 600,
                      backgroundColor: "#f3f4f6",
                      padding: "4px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {stop.distance?.toFixed(1)} km
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


