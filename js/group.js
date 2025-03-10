// Updated Group-related functions with leader/helper requirements

// Create a new group
function createGroup(name, color, id = null) {
    const group = {
        id: id || Date.now().toString(),
        name: name,
        color: color
    };
    
    groups.push(group);
    updateGroupsList();
    updateGroupDropdowns();
    
    return group;
}

// Update the groups list in the sidebar
function updateGroupsList() {
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';
    
    groups.forEach(group => {
        const groupPersons = persons.filter(p => p.group === group.id);
        const meetingCount = meetingPoints.filter(m => m.group === group.id).length;
        
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeft = `4px solid ${group.color}`;
        
        item.innerHTML = `
            <span>${group.name} (${groupPersons.length})</span>
            <div class="group-buttons">
                <button class="view-group" data-id="${group.id}">View</button>
                <button class="delete-group" data-id="${group.id}">✕</button>
            </div>
        `;
        
        // Add event listeners to the buttons
        const viewButton = item.querySelector('.view-group');
        const deleteButton = item.querySelector('.delete-group');
        
        viewButton.addEventListener('click', () => {
            // Show group details modal
            showGroupDetailsModal(group.id);
        });
        
        deleteButton.addEventListener('click', () => {
            // Confirm before deleting
            if (confirm(`Are you sure you want to delete "${group.name}"? This will not delete the people or meeting points, just the group.`)) {
                removeGroup(group.id);
            }
        });
        
        groupList.appendChild(item);
    });
}
// Remove a group and update all markers that were in that group
function removeGroup(groupId) {
    // Find the group index
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return;
    
    // Update all persons that were in this group
    persons.forEach(person => {
        if (person.group === groupId) {
            person.group = null;
            updatePersonColor(person);
        }
    });
    
    // Update all meeting points that were in this group
    meetingPoints.forEach(meeting => {
        if (meeting.group === groupId) {
            meeting.group = null;
            updateMeetingColor(meeting);
        }
    });
    
    // Remove the group
    groups.splice(groupIndex, 1);
    
    // Update UI
    updateGroupsList();
    updateGroupDropdowns();
    updatePersonsList();
    updateMeetingsList();
}

// Update the group dropdowns in the modals
function updateGroupDropdowns() {
    updateDropdown('person-group');
    updateDropdown('meeting-group');
}

// View a specific group (focus map on all markers in the group)
function viewGroup(groupId) {
    const groupPersons = persons.filter(p => p.group === groupId);
    const groupMeetings = meetingPoints.filter(m => m.group === groupId);
    
    if (groupPersons.length === 0 && groupMeetings.length === 0) {
        alert('No items in this group');
        return;
    }
    
    // Create bounds that include all markers in the group
    const bounds = new google.maps.LatLngBounds();
    
    groupPersons.forEach(personData => {
        bounds.extend(personData.marker.getPosition());
    });
    
    groupMeetings.forEach(meetingData => {
        bounds.extend(meetingData.marker.getPosition());
    });
    
    // Fit map to these bounds
    map.fitBounds(bounds);
}


// Check if a potential group meets the minimum requirements
function groupMeetsRequirements(personsInGroup) {
    console.log('Checking group requirements for', personsInGroup.length, 'persons');
    
    // Check minimum group size
    if (personsInGroup.length < appConfig.autoGrouping.minGroupSize) {
        console.warn('Group size too small');
        return false;
    }
    
    // Count roles in the group
    const elderCount = personsInGroup.filter(p => p.elder).length;
    const servantCount = personsInGroup.filter(p => p.servant).length;
    const pioneerCount = personsInGroup.filter(p => p.pioneer).length;
    const leaderCount = personsInGroup.filter(p => p.leader).length;
    const helperCount = personsInGroup.filter(p => p.helper).length;
    const publisherCount = personsInGroup.filter(p => p.publisher).length;
    
    console.log('Role counts:', {
        elderCount,
        servantCount,
        pioneerCount,
        leaderCount,
        helperCount,
        publisherCount
    });
    
    // Check role requirements
    const config = appConfig.autoGrouping.requirements;
    
    if (elderCount < config.minElders) {
        console.warn('Not enough elders');
        return false;
    }
    
    if (servantCount < config.minServants) {
        console.warn('Not enough servants');
        return false;
    }
    
    if (pioneerCount < config.minPioneers) {
        console.warn('Not enough pioneers');
        return false;
    }
    
    if (leaderCount < config.minLeaders) {
        console.warn('Not enough leaders');
        return false;
    }
    
    if (helperCount < config.minHelpers) {
        console.warn('Not enough helpers');
        return false;
    }
    
    // Check publisher requirement if defined
    if (config.minPublishers && publisherCount < config.minPublishers) {
        console.warn('Not enough publishers');
        return false;
    }
    
    return true;
}

// Show loading indicator while grouping
function showGroupingLoadingIndicator() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById('grouping-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'grouping-overlay';
        overlay.innerHTML = `
            <div class="grouping-loading-container">
                <div class="spinner"></div>
                <p>Creating optimal groups...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('grouping-overlay').style.display = 'flex';
    }
}

// Hide loading indicator
function hideGroupingLoadingIndicator() {
    const overlay = document.getElementById('grouping-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Update marker colors based on their groups
function updateMarkerColors() {
    // Only update markers that are visible in the current viewport
    const bounds = map.getBounds();
    
    // If bounds aren't ready, update all markers
    if (!bounds) {
        persons.forEach(personData => {
            updatePersonColor(personData);
        });
        
        meetingPoints.forEach(meetingData => {
            updateMeetingColor(meetingData);
        });
        return;
    }
    
    // For persons, only update those in the current viewport
    persons.forEach(personData => {
        if (bounds.contains(personData.marker.getPosition())) {
            updatePersonColor(personData);
        }
    });
    
    // For meeting points, only update those in the current viewport
    meetingPoints.forEach(meetingData => {
        if (bounds.contains(meetingData.marker.getPosition())) {
            updateMeetingColor(meetingData);
        }
    });
}

function setupMarkerUpdateOnViewportChange() {
    if (map) {
        google.maps.event.addListener(map, 'idle', function() {
            // Update markers in the new viewport
            updateMarkerColors();
        });
    }
}