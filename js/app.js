// Main application initialization

// Initialize the map
function initMap() {
  // Check if the map element exists
  const mapElement = document.getElementById('map');
  if (!mapElement) {
      console.error('Map container element not found!');
      // Show error message to user
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
          mapContainer.innerHTML = `
              <div class="map-error">
                  <h3>Map Could Not Be Loaded</h3>
                  <p>There was a problem initializing the map. Please refresh the page and try again.</p>
              </div>
          `;
      }
      return;
  }

  map = new google.maps.Map(mapElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
  });
    // Set up autocomplete search
    const input = document.getElementById('search-input');
    autocomplete = new google.maps.places.Autocomplete(input);
    
    // Bias autocomplete results to current map bounds
    autocomplete.bindTo('bounds', map);
    
    // Add event listener for place selection
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            alert("No location data for this place");
            return;
        }
        
        // Center map on selected location
        map.setCenter(place.geometry.location);
        map.setZoom(15);
        
        // Add a marker based on the current mode
        if (mapClickMode === 'meeting') {
            addMeetingPointAtLocation(place.geometry.location, place.name);
        } else {
            // Default to person
            addPersonAtLocation(place.geometry.location, place.name);
        }
    });
    
    // Add click listener to map for adding markers
    map.addListener('click', (event) => {
        if (mapClickMode === 'meeting') {
            addMeetingPointAtLocation(event.latLng);
        } else if (mapClickMode === 'person') {
            addPersonAtLocation(event.latLng);
        }
        // If null, do nothing on map click
    });
    
    // Set up UI event listeners
    setupEventListeners();
    setupTabNavigation();
    setupMarkerUpdateOnViewportChange();
    
    // Initialize travel time services
    initTravelTimeServices();
}