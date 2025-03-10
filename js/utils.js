// Utility functions

// Calculate distance between two points (simple Euclidean distance)
function calculateDistance(lat1, lng1, lat2, lng2) {
    // Use Google's spherical geometry library if available
    if (google && google.maps && google.maps.geometry && google.maps.geometry.spherical) {
        try {
            const point1 = new google.maps.LatLng(lat1, lng1);
            const point2 = new google.maps.LatLng(lat2, lng2);
            return google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 111000; // Convert to degrees
        } catch (e) {
            console.warn('Error using Google spherical distance, falling back to Euclidean:', e);
            // Fall back to Euclidean if Google's method fails
        }
    }
    
    // Simple Euclidean distance as fallback
    // This is less accurate but better than failing completely
    return Math.sqrt(
        Math.pow(lat1 - lat2, 2) + 
        Math.pow(lng1 - lng2, 2)
    );
}

// Generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Update add button styles based on active mode
function updateAddButtonStyles() {
    const personButton = document.getElementById('add-person');
    const meetingButton = document.getElementById('add-meeting');
    
    personButton.style.backgroundColor = mapClickMode === 'person' ? '#3367D6' : '#4285F4';
    meetingButton.style.backgroundColor = mapClickMode === 'meeting' ? '#3367D6' : '#4285F4';
}

// Helper to update a specific dropdown
function updateDropdown(id) {
    const groupSelect = document.getElementById(id);
    if (!groupSelect) return;
    
    groupSelect.innerHTML = '<option value="">No Group</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}