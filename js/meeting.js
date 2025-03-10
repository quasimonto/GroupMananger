// Meeting point-related functions

// Add a meeting point at a specific location
function addMeetingPointAtLocation(location, name = 'New Meeting Point') {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: getMeetingMarkerIcon({}) // Using empty object since it's a new meeting with no group
    });
    
    const meetingData = {
        id: Date.now().toString(),
        marker: marker,
        name: name,
        description: '',
        group: null,
        lat: location.lat(),
        lng: location.lng()
    };
    
    meetingPoints.push(meetingData);
    
    // Add click listener to the marker for editing
    marker.addListener('click', () => {
        selectedMeeting = meetingData;
        showMeetingModal(meetingData);
    });
    
    updateMeetingsList();
    // Reset the map click mode after adding
    mapClickMode = null;
    updateAddButtonStyles();
}

// Update the meeting points list in the sidebar
function updateMeetingsList() {
    const meetingList = document.getElementById('meeting-list');
    meetingList.innerHTML = '';
    
    // Apply name filter if active
    let filteredMeetings = meetingPoints;
    
    if (nameFilter && nameFilter !== '') {
        filteredMeetings = filteredMeetings.filter(meeting => 
            meeting.name.toLowerCase().includes(nameFilter.toLowerCase())
        );
    }
    
    filteredMeetings.forEach(meetingData => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        
        item.innerHTML = `
            <div>${meetingData.name}</div>
            <button class="delete-button" data-id="${meetingData.id}">✕</button>
        `;
        
        // Add click event to focus on the meeting point
        item.querySelector('div').addEventListener('click', () => {
            map.panTo(meetingData.marker.getPosition());
            map.setZoom(15);
        });
        
        // Add delete button handler
        item.querySelector('.delete-button').addEventListener('click', (e) => {
            e.stopPropagation();
            removeMeetingPoint(meetingData.id);
        });
        
        meetingList.appendChild(item);
    });
}
// Remove a meeting point
function removeMeetingPoint(meetingId) {
    const meetingIndex = meetingPoints.findIndex(m => m.id === meetingId);
    if (meetingIndex !== -1) {
        // Remove the marker from the map
        meetingPoints[meetingIndex].marker.setMap(null);
        // Remove from the array
        meetingPoints.splice(meetingIndex, 1);
        // Update the list
        updateMeetingsList();
    }
}

// Show modal for adding/editing meeting point details
function showMeetingModal(meetingData = null) {
    const modal = document.getElementById('meeting-modal');
    const title = document.getElementById('meeting-modal-title');
    const nameInput = document.getElementById('meeting-name');
    const descriptionInput = document.getElementById('meeting-description');
    const groupSelect = document.getElementById('meeting-group');
    
    // Update modal title
    title.textContent = meetingData ? 'Edit Meeting Point' : 'Add Meeting Point';
    
    // Populate form if editing
    if (meetingData) {
        nameInput.value = meetingData.name;
        descriptionInput.value = meetingData.description;
    } else {
        nameInput.value = 'New Meeting Point';
        descriptionInput.value = '';
    }
    
    // Populate group dropdown
    groupSelect.innerHTML = '<option value="">No Group</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (meetingData && meetingData.group === group.id) {
            option.selected = true;
        }
        groupSelect.appendChild(option);
    });
    
    // Show the modal
    modal.style.display = 'flex';
}

// Assign a meeting point to a group
function assignMeetingToGroup(meetingData, groupId) {
    meetingData.group = groupId;
    updateMeetingColor(meetingData);
}

// Update a single meeting point's color
function updateMeetingColor(meetingData) {
    // Get the group color if the meeting is in a group
    let groupColor = null;
    if (meetingData.group) {
        const group = groups.find(g => g.id === meetingData.group);
        if (group) {
            groupColor = group.color;
        }
    }
    
    // Set icon based on configuration and group status
    meetingData.marker.setIcon(getMeetingMarkerIcon(meetingData, groupColor));
}