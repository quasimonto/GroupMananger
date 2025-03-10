// Filtering and visibility functionality with leader/helper filters

// Globals for filter state
let nameFilter = '';
let peopleVisible = true;
let meetingsVisible = true;
let groupsVisible = true;

// Extended active filters for people list
let activeFilters = {
    elder: false,
    servant: false,
    pioneer: false,
    familyHead: false,
    leader: false,    // New filter
    helper: false     // New filter
};

// Apply filters to person list and map markers
function applyFilters() {
    const nameFilterValue = document.getElementById('name-filter').value.toLowerCase();
    nameFilter = nameFilterValue;
    
    // Update active role filters
    activeFilters.elder = document.getElementById('filter-elder').checked;
    activeFilters.servant = document.getElementById('filter-servant').checked;
    activeFilters.pioneer = document.getElementById('filter-pioneer').checked;
    activeFilters.familyHead = document.getElementById('filter-familyhead').checked;
    activeFilters.leader = document.getElementById('filter-leader').checked;      // New filter
    activeFilters.helper = document.getElementById('filter-helper').checked;      // New filter
    
    // Update visibility toggles
    peopleVisible = document.getElementById('toggle-people').checked;
    meetingsVisible = document.getElementById('toggle-meetings').checked;
    groupsVisible = document.getElementById('toggle-groups').checked;
    
    // Apply filters to person list and markers
    updatePersonsList();
    updateMeetingsList();
    
    // Apply visibility filters to markers
    updateMarkerVisibility();
}

// Clear all filters
function clearFilters() {
    // Clear name filter
    document.getElementById('name-filter').value = '';
    nameFilter = '';
    
    // Clear role filters
    document.getElementById('filter-elder').checked = false;
    document.getElementById('filter-servant').checked = false;
    document.getElementById('filter-pioneer').checked = false;
    document.getElementById('filter-familyhead').checked = false;
    document.getElementById('filter-leader').checked = false;     // New filter
    document.getElementById('filter-helper').checked = false;     // New filter
    
    activeFilters.elder = false;
    activeFilters.servant = false;
    activeFilters.pioneer = false;
    activeFilters.familyHead = false;
    activeFilters.leader = false;                               // New filter
    activeFilters.helper = false;                               // New filter
    
    // Reset visibility (all visible)
    document.getElementById('toggle-people').checked = true;
    document.getElementById('toggle-meetings').checked = true;
    document.getElementById('toggle-groups').checked = true;
    
    peopleVisible = true;
    meetingsVisible = true;
    groupsVisible = true;
    
    // Apply changes
    updatePersonsList();
    updateMeetingsList();
    updateMarkerVisibility();
    updateMarkerColors(); // Restore group colors
}

// Update marker visibility based on toggle settings
function updateMarkerVisibility() {
    // Update person markers
    persons.forEach(person => {
        // Filter by name if name filter is active
        const nameMatch = nameFilter === '' || person.name.toLowerCase().includes(nameFilter);
        
        // Filter by role if any role filter is active
        const anyFilterActive = 
            activeFilters.elder || 
            activeFilters.servant || 
            activeFilters.pioneer || 
            activeFilters.familyHead ||
            activeFilters.leader ||    // New filter
            activeFilters.helper;      // New filter
            
        let roleMatch = true;
        if (anyFilterActive) {
            roleMatch = 
                (activeFilters.elder && person.elder) ||
                (activeFilters.servant && person.servant) ||
                (activeFilters.pioneer && person.pioneer) ||
                (activeFilters.familyHead && person.familyHead) ||
                (activeFilters.leader && person.leader) ||    // New filter condition
                (activeFilters.helper && person.helper);      // New filter condition
        }
        
        // Only show if all filters pass AND people are toggled visible
        const shouldBeVisible = peopleVisible && nameMatch && roleMatch;
        person.marker.setVisible(shouldBeVisible);
    });
    
    // Update meeting point markers
    meetingPoints.forEach(meeting => {
        // Filter by name
        const nameMatch = nameFilter === '' || meeting.name.toLowerCase().includes(nameFilter);
        
        // Only show if name filter passes AND meetings are toggled visible
        const shouldBeVisible = meetingsVisible && nameMatch;
        meeting.marker.setVisible(shouldBeVisible);
    });
    
    // Update group styling if groups toggle is changed
    if (!groupsVisible) {
        // If groups are hidden, set all markers to their default style (no group colors)
        persons.forEach(person => {
            if (person.group) {
                // Temporarily set group to null for styling purposes
                const originalGroup = person.group;
                person.group = null;
                updatePersonColor(person);
                // Restore the original group assignment
                person.group = originalGroup;
            }
        });
        
        meetingPoints.forEach(meeting => {
            if (meeting.group) {
                const originalGroup = meeting.group;
                meeting.group = null;
                updateMeetingColor(meeting);
                meeting.group = originalGroup;
            }
        });
    } else {
        // If groups are visible, restore group colors
        updateMarkerColors();
    }
}

// Initialize filtering functionality
function initFilters() {
    // Set up name filter input with debounce
    const nameFilterInput = document.getElementById('name-filter');
    nameFilterInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Set up filter buttons
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('clear-filter').addEventListener('click', clearFilters);
    
    // Set up visibility toggles
    document.getElementById('toggle-people').addEventListener('change', applyFilters);
    document.getElementById('toggle-meetings').addEventListener('change', applyFilters);
    document.getElementById('toggle-groups').addEventListener('change', applyFilters);
}

// Simple debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Add to initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
});