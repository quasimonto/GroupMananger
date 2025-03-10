// Import/Export functionality

// Export all data to a JSON file
function exportData() {
    // Create a comprehensive data object that includes all data
    const exportData = {
        version: '1.2', // Updated version to track export format
        exportDate: new Date().toISOString(),
        
        // Export full application configuration
        appConfig: JSON.parse(JSON.stringify(appConfig)),
        
        // Export persons with COMPREHENSIVE details
        persons: persons.map(person => {
            // Extract marker details safely
            const markerPosition = person.marker.getPosition();
            
            return {
                // Basic identification
                id: person.id,
                name: person.name,
                
                // Location details
                lat: markerPosition.lat(),
                lng: markerPosition.lng(),
                
                // Group association
                group: person.group,
                
                // Detailed role information
                elder: person.elder,
                servant: person.servant,
                pioneer: person.pioneer,
                spouse: person.spouse,
                child: person.child,
                familyHead: person.familyHead,
                leader: person.leader,
                helper: person.helper,
                
                // Comprehensive marker details
                markerDetails: {
                    // Position and basic properties
                    draggable: person.marker.getDraggable(),
                    visible: person.marker.getVisible(),
                    
                    // Detailed icon information
                    icon: person.marker.getIcon(),
                    
                    // Animation details
                    animation: person.marker.getAnimation(),
                    
                    // Additional Google Maps marker properties
                    clickable: person.marker.getClickable(),
                    
                    // Custom styling details
                    zIndex: person.marker.getZIndex()
                }
            };
        }),
        
        // Export meeting points with ALL details
        meetingPoints: meetingPoints.map(meeting => {
            // Extract marker details safely
            const markerPosition = meeting.marker.getPosition();
            
            return {
                id: meeting.id,
                name: meeting.name,
                description: meeting.description,
                
                // Location details
                lat: markerPosition.lat(),
                lng: markerPosition.lng(),
                
                // Group association
                group: meeting.group,
                
                // Comprehensive marker details
                markerDetails: {
                    // Position and basic properties
                    draggable: meeting.marker.getDraggable(),
                    visible: meeting.marker.getVisible(),
                    
                    // Detailed icon information
                    icon: meeting.marker.getIcon(),
                    
                    // Animation details
                    animation: meeting.marker.getAnimation(),
                    
                    // Additional Google Maps marker properties
                    clickable: meeting.marker.getClickable(),
                    
                    // Custom styling details
                    zIndex: meeting.marker.getZIndex()
                }
            };
        }),
        
        // Export groups with full details
        groups: groups.map(group => ({
            id: group.id,
            name: group.name,
            color: group.color
        }))
    };

    // Convert to JSON with pretty printing
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}
// Import data from a JSON file
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate the data format (add more flexible checks)
        if (!data.persons || !data.meetingPoints) {
            throw new Error('Invalid data format');
        }
        
        // Clear existing data
        clearAllData();
        
        // Import groups (optional, handle cases where groups might be missing)
        if (data.groups) {
            data.groups.forEach(groupData => {
                createGroup(groupData.name, groupData.color, groupData.id);
            });
        }
        
        // Import persons
        data.persons.forEach(personData => {
            try {
                // Ensure all required properties exist
                const defaultPersonData = {
                    elder: false,
                    servant: false,
                    pioneer: false,
                    spouse: false,
                    child: false,
                    familyHead: false,
                    leader: false,
                    helper: false
                };
                
                const mergedPersonData = {...defaultPersonData, ...personData};
                
                // Create a proper LatLng object for the position
                const location = new google.maps.LatLng(
                    parseFloat(mergedPersonData.lat),
                    parseFloat(mergedPersonData.lng)
                );
                
                // Determine group color if applicable
                let groupColor = null;
                if (mergedPersonData.group) {
                    const group = groups.find(g => g.id === mergedPersonData.group);
                    if (group) {
                        groupColor = group.color;
                    }
                }
                
                // Create marker with generated icon
                const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    icon: getPersonMarkerIcon(mergedPersonData, groupColor)
                });
                
                // Create person object
                const person = {
                    id: mergedPersonData.id || Date.now().toString(),
                    marker: marker,
                    name: mergedPersonData.name || 'Unnamed Person',
                    group: mergedPersonData.group,
                    lat: location.lat(),
                    lng: location.lng(),
                    elder: mergedPersonData.elder,
                    servant: mergedPersonData.servant,
                    pioneer: mergedPersonData.pioneer,
                    spouse: mergedPersonData.spouse,
                    child: mergedPersonData.child,
                    familyHead: mergedPersonData.familyHead,
                    leader: mergedPersonData.leader,
                    helper: mergedPersonData.helper
                };
                
                persons.push(person);
                
                // Add click listener to the marker for editing
                marker.addListener('click', () => {
                    selectedPerson = person;
                    showPersonModal(person);
                });
            } catch (err) {
                console.error('Error importing person:', err, personData);
            }
        });
        
        // Import meeting points
        data.meetingPoints.forEach(meetingData => {
            try {
                // Ensure all required properties exist
                const defaultMeetingData = {
                    description: '',
                    group: null
                };
                
                const mergedMeetingData = {...defaultMeetingData, ...meetingData};
                
                // Create a proper LatLng object for the position
                const location = new google.maps.LatLng(
                    parseFloat(mergedMeetingData.lat),
                    parseFloat(mergedMeetingData.lng)
                );
                
                // Determine group color if applicable
                let groupColor = null;
                if (mergedMeetingData.group) {
                    const group = groups.find(g => g.id === mergedMeetingData.group);
                    if (group) {
                        groupColor = group.color;
                    }
                }
                
                // Create marker with generated icon
                const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    icon: getMeetingMarkerIcon(mergedMeetingData, groupColor)
                });
                
                // Create meeting object
                const meeting = {
                    id: mergedMeetingData.id || Date.now().toString(),
                    marker: marker,
                    name: mergedMeetingData.name || 'Unnamed Meeting Point',
                    description: mergedMeetingData.description,
                    group: mergedMeetingData.group,
                    lat: location.lat(),
                    lng: location.lng()
                };
                
                meetingPoints.push(meeting);
                
                // Add click listener to the marker for editing
                marker.addListener('click', () => {
                    selectedMeeting = meeting;
                    showMeetingModal(meeting);
                });
            } catch (err) {
                console.error('Error importing meeting point:', err, meetingData);
            }
        });
        
        // Update UI
        updatePersonsList();
        updateMeetingsList();
        updateGroupsList();
        
        // Fit map to all markers
        fitMapToAllMarkers();
        
        return { success: true, message: 'Data imported successfully' };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: `Import failed: ${error.message}` };
    }
}
// Clear all existing data from the map
function clearAllData() {
    // Remove all person markers from the map
    persons.forEach(personData => {
        personData.marker.setMap(null);
    });
    
    // Remove all meeting markers from the map
    meetingPoints.forEach(meetingData => {
        meetingData.marker.setMap(null);
    });
    
    // Clear arrays
    persons = [];
    meetingPoints = [];
    groups = [];
    
    // Reset selected items
    selectedPerson = null;
    selectedMeeting = null;
    
    // Update UI
    updatePersonsList();
    updateMeetingsList();
    updateGroupsList();
}

// Fit the map to show all markers
function fitMapToAllMarkers() {
    if (persons.length === 0 && meetingPoints.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    persons.forEach(person => {
        bounds.extend(person.marker.getPosition());
    });
    
    meetingPoints.forEach(meeting => {
        bounds.extend(meeting.marker.getPosition());
    });
    
    map.fitBounds(bounds);
}

// Handler for the file import input
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const result = importData(e.target.result);
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the file input so the same file can be loaded again if needed
    event.target.value = '';
}

// Initialize import/export functionality
function initImportExport() {
    // Add event listener for import file input
    document.getElementById('import-file-input').addEventListener('change', handleFileImport);
    
    // Add event listeners for import/export buttons
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
}

// Add to initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initImportExport();
});