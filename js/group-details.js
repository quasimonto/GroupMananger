// Group details functionality

// Current selected group
let selectedGroup = null;

// Show group details modal
function showGroupDetailsModal(groupId) {
    // Find the group
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    selectedGroup = group;
    
    // Get the modal elements
    const modal = document.getElementById('group-details-modal');
    const titleElement = document.getElementById('group-details-title');
    const nameInput = document.getElementById('edit-group-name');
    const colorInput = document.getElementById('edit-group-color');
    
    // Set the title and form fields
    titleElement.textContent = `Group Details: ${group.name}`;
    nameInput.value = group.name;
    colorInput.value = group.color;
    
    // Update group statistics
    updateGroupStatistics(group);
    
    // Update members list
    updateGroupMembersList(group);
    
    // Update meeting points list
    updateGroupMeetingsList(group);
    
    // Show the modal
    modal.style.display = 'flex';
}

// Update group statistics in the modal
function updateGroupStatistics(group) {
    // Find all persons in the group
    const groupPersons = persons.filter(p => p.group === group.id);
    
    // Count roles
    const elderCount = groupPersons.filter(p => p.elder).length;
    const servantCount = groupPersons.filter(p => p.servant).length;
    const pioneerCount = groupPersons.filter(p => p.pioneer).length;
    const leaderCount = groupPersons.filter(p => p.leader).length;
    const helperCount = groupPersons.filter(p => p.helper).length;
    const childCount = groupPersons.filter(p => p.child).length;
    
    // Find meeting points in the group
    const groupMeetings = meetingPoints.filter(m => m.group === group.id);
    
    // Update statistics elements
    document.getElementById('group-stat-total').textContent = groupPersons.length;
    document.getElementById('group-stat-elders').textContent = elderCount;
    document.getElementById('group-stat-servants').textContent = servantCount;
    document.getElementById('group-stat-pioneers').textContent = pioneerCount;
    document.getElementById('group-stat-leaders').textContent = leaderCount;
    document.getElementById('group-stat-helpers').textContent = helperCount;
    document.getElementById('group-stat-children').textContent = childCount;
    document.getElementById('group-stat-meetings').textContent = groupMeetings.length;
}

// Update the members list in the modal
function updateGroupMembersList(group) {
    const membersList = document.getElementById('group-members-list');
    membersList.innerHTML = '';
    
    // Find all persons in the group
    const groupPersons = persons.filter(p => p.group === group.id);
    
    if (groupPersons.length === 0) {
        membersList.innerHTML = '<div class="empty-list-message">No members in this group</div>';
        return;
    }
    
    // Sort by name
    groupPersons.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a member item for each person
    groupPersons.forEach(person => {
        const item = document.createElement('div');
        item.className = 'member-item';
        
        // Generate role text
        let roleText = [];
        if (person.elder) roleText.push('Elder');
        if (person.servant) roleText.push('Servant');
        if (person.pioneer) roleText.push('Pioneer');
        if (person.leader) roleText.push('Leader');
        if (person.helper) roleText.push('Helper');
        if (person.child) roleText.push('Child');
        
        item.innerHTML = `
            <div class="member-info">
                <div class="member-name">${person.name}</div>
                <div class="member-role">${roleText.join(', ') || 'Publisher'}</div>
            </div>
            <button class="member-locate-btn" data-id="${person.id}">Locate</button>
        `;
        
        // Add locate button handler
        item.querySelector('.member-locate-btn').addEventListener('click', () => {
            // Zoom to the person
            map.panTo(person.marker.getPosition());
            map.setZoom(15);
            
            // Highlight the marker
            highlightMarker(person.marker);
        });
        
        membersList.appendChild(item);
    });
}

// Update the meeting points list in the modal
function updateGroupMeetingsList(group) {
    const meetingsList = document.getElementById('group-meetings-list');
    meetingsList.innerHTML = '';
    
    // Find all meeting points in the group
    const groupMeetings = meetingPoints.filter(m => m.group === group.id);
    
    if (groupMeetings.length === 0) {
        meetingsList.innerHTML = '<div class="empty-list-message">No meeting points in this group</div>';
        return;
    }
    
    // Sort by name
    groupMeetings.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a meeting item for each meeting point
    groupMeetings.forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        
        item.innerHTML = `
            <div class="meeting-info">
                <div class="meeting-name">${meeting.name}</div>
            </div>
            <button class="meeting-locate-btn" data-id="${meeting.id}">Locate</button>
        `;
        
        // Add locate button handler
        item.querySelector('.meeting-locate-btn').addEventListener('click', () => {
            // Zoom to the meeting point
            map.panTo(meeting.marker.getPosition());
            map.setZoom(15);
            
            // Highlight the marker
            highlightMarker(meeting.marker);
        });
        
        meetingsList.appendChild(item);
    });
}

// Save group details changes
function saveGroupDetails() {
    if (!selectedGroup) return;
    
    // Get the updated values
    const nameInput = document.getElementById('edit-group-name');
    const colorInput = document.getElementById('edit-group-color');
    
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;
    
    if (newName === '') {
        alert('Group name cannot be empty');
        return;
    }
    
    // Update the group
    selectedGroup.name = newName;
    selectedGroup.color = newColor;
    
    // Update markers for all persons in this group
    persons.forEach(person => {
        if (person.group === selectedGroup.id) {
            updatePersonColor(person);
        }
    });
    
    // Update UI
    updateGroupsList();
    
    // Close the modal
    document.getElementById('group-details-modal').style.display = 'none';
    
    // Reset selected group
    selectedGroup = null;
}

// Initialize group details functionality
function initGroupDetails() {
    // Set up save button handler
    document.getElementById('save-group-details').addEventListener('click', saveGroupDetails);
    
    // Set up close button handler
    document.getElementById('close-group-details').addEventListener('click', () => {
        document.getElementById('group-details-modal').style.display = 'none';
        selectedGroup = null;
    });
}

// Add to initialization
document.addEventListener('DOMContentLoaded', initGroupDetails);