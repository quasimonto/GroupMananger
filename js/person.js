// Updated Person-related functions

// Add a person at a specific location
function addPersonAtLocation(location, name = 'New Person') {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: getPersonMarkerIcon({}) // Using empty object since it's a new person with no group
    });
    
    const personData = {
        id: Date.now().toString(),
        marker: marker,
        name: name,
        group: null,
        lat: location.lat(),
        lng: location.lng(),
        elder: false,
        servant: false,
        pioneer: false,
        spouse: false,
        child: false,
        familyHead: false,
        leader: false,  // New property
        helper: false   // New property
    };
    
    persons.push(personData);
    
    // Add click listener to the marker for editing
    marker.addListener('click', () => {
        selectedPerson = personData;
        showPersonModal(personData);
    });
    
    updatePersonsList();
    // Reset the map click mode after adding
    mapClickMode = null;
    updateAddButtonStyles();
}

// Update the persons list in the sidebar
function updatePersonsList() {
    const personList = document.getElementById('person-list');
    personList.innerHTML = '';
    
    // Apply filters
    let filteredPersons = persons;
    
    // Filter by name if name filter is active
    if (nameFilter && nameFilter !== '') {
        filteredPersons = filteredPersons.filter(person => 
            person.name.toLowerCase().includes(nameFilter.toLowerCase())
        );
    }
    
    // Check if any role filters are active
    const anyFilterActive = 
        activeFilters.elder || 
        activeFilters.servant || 
        activeFilters.pioneer || 
        activeFilters.familyHead ||
        activeFilters.leader ||    // New filter
        activeFilters.helper;      // New filter
        
    if (anyFilterActive) {
        filteredPersons = filteredPersons.filter(person => 
            (activeFilters.elder && person.elder) ||
            (activeFilters.servant && person.servant) ||
            (activeFilters.pioneer && person.pioneer) ||
            (activeFilters.familyHead && person.familyHead) ||
            (activeFilters.leader && person.leader) ||    // New filter condition
            (activeFilters.helper && person.helper)       // New filter condition
        );
    }
    
    filteredPersons.forEach(personData => {
        const item = document.createElement('div');
        item.className = 'person-item';
        
        // Add role indicators
        let roleIndicators = '';
        if (personData.elder) roleIndicators += '<span class="role-tag elder-tag">E</span>';
        if (personData.servant) roleIndicators += '<span class="role-tag servant-tag">S</span>';
        if (personData.pioneer) roleIndicators += '<span class="role-tag pioneer-tag">P</span>';
        if (personData.leader) roleIndicators += '<span class="role-tag leader-tag">L</span>';
        if (personData.helper) roleIndicators += '<span class="role-tag helper-tag">H</span>';
        
        item.innerHTML = `
            <div class="person-info">
                ${personData.name}
                <div class="role-indicators">${roleIndicators}</div>
            </div>
            <div class="person-actions">
                <button class="edit-button" data-id="${personData.id}">✎</button>
                <button class="delete-button" data-id="${personData.id}">✕</button>
            </div>
        `;
        
        // Add double-click event to edit the person
        item.querySelector('.person-info').addEventListener('dblclick', () => {
            selectedPerson = personData;
            showPersonModal(personData);
        });
        
        // Add click event to focus on the person
        item.querySelector('.person-info').addEventListener('click', () => {
            map.panTo(personData.marker.getPosition());
            map.setZoom(15);
        });
        
        // Add edit button handler
        item.querySelector('.edit-button').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedPerson = personData;
            showPersonModal(personData);
        });
        
        // Add delete button handler
        item.querySelector('.delete-button').addEventListener('click', (e) => {
            e.stopPropagation();
            removePerson(personData.id);
        });
        
        personList.appendChild(item);
    });
}

// Remove a person
function removePerson(personId) {
    const personIndex = persons.findIndex(p => p.id === personId);
    if (personIndex !== -1) {
        // Remove the marker from the map
        persons[personIndex].marker.setMap(null);
        // Remove from the array
        persons.splice(personIndex, 1);
        // Update the list
        updatePersonsList();
    }
}

// Show modal for adding/editing person details
function showPersonModal(personData = null) {
    const modal = document.getElementById('person-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('person-name');
    const groupSelect = document.getElementById('person-group');
    const travelTimesButton = document.getElementById('show-travel-times');
    
    const elderCheckbox = document.getElementById('person-elder');
    const servantCheckbox = document.getElementById('person-servant');
    const pioneerCheckbox = document.getElementById('person-pioneer');
    const spouseCheckbox = document.getElementById('person-spouse');
    const childCheckbox = document.getElementById('person-child');
    const familyHeadCheckbox = document.getElementById('person-familyhead');
    const leaderCheckbox = document.getElementById('person-leader');     // New checkbox
    const helperCheckbox = document.getElementById('person-helper');     // New checkbox
    
    // Update modal title
    title.textContent = personData ? 'Edit Person' : 'Add Person';
    
    // Show/hide travel time button based on whether we're editing or adding
    travelTimesButton.style.display = personData ? 'block' : 'none';
    
    // Set up travel time button click handler
    if (personData) {
        travelTimesButton.onclick = () => {
            // Close the person modal
            modal.style.display = 'none';
            // Open the travel time modal
            showTravelTimeModal(personData);
        };
    }
    
    // Populate form if editing
    if (personData) {
        nameInput.value = personData.name;
        elderCheckbox.checked = personData.elder;
        servantCheckbox.checked = personData.servant;
        pioneerCheckbox.checked = personData.pioneer;
        spouseCheckbox.checked = personData.spouse;
        childCheckbox.checked = personData.child;
        familyHeadCheckbox.checked = personData.familyHead;
        leaderCheckbox.checked = personData.leader;     // New property
        helperCheckbox.checked = personData.helper;     // New property
    } else {
        nameInput.value = 'New Person';
        elderCheckbox.checked = false;
        servantCheckbox.checked = false;
        pioneerCheckbox.checked = false;
        spouseCheckbox.checked = false;
        childCheckbox.checked = false;
        familyHeadCheckbox.checked = false;
        leaderCheckbox.checked = false;                // New property
        helperCheckbox.checked = false;                // New property
    }
    
    // Populate group dropdown
    groupSelect.innerHTML = '<option value="">No Group</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (personData && personData.group === group.id) {
            option.selected = true;
        }
        groupSelect.appendChild(option);
    });
    
    // Show the modal
    modal.style.display = 'flex';
}

// Handle person save
document.getElementById('save-person').addEventListener('click', () => {
    const name = document.getElementById('person-name').value;
    const groupId = document.getElementById('person-group').value;
    
    const elder = document.getElementById('person-elder').checked;
    const servant = document.getElementById('person-servant').checked;
    const pioneer = document.getElementById('person-pioneer').checked;
    const spouse = document.getElementById('person-spouse').checked;
    const child = document.getElementById('person-child').checked;
    const familyHead = document.getElementById('person-familyhead').checked;
    const leader = document.getElementById('person-leader').checked;     // New property
    const helper = document.getElementById('person-helper').checked;     // New property
    
    if (selectedPerson) {
        // Update existing person
        selectedPerson.name = name;
        selectedPerson.group = groupId || null;
        selectedPerson.elder = elder;
        selectedPerson.servant = servant;
        selectedPerson.pioneer = pioneer;
        selectedPerson.spouse = spouse;
        selectedPerson.child = child;
        selectedPerson.familyHead = familyHead;
        selectedPerson.leader = leader;     // New property
        selectedPerson.helper = helper;     // New property
        updatePersonColor(selectedPerson);
    }
    
    // Close modal and update list
    document.getElementById('person-modal').style.display = 'none';
    updatePersonsList();
    selectedPerson = null;
});

// Assign a person to a group
function assignPersonToGroup(personData, groupId) {
    personData.group = groupId;
    updatePersonColor(personData);
}

// Update a single person's color
function updatePersonColor(personData) {
    // Get the group color if the person is in a group
    let groupColor = null;
    if (personData.group) {
        const group = groups.find(g => g.id === personData.group);
        if (group) {
            groupColor = group.color;
        }
    }
    
    // Set icon based on configuration and group status
    personData.marker.setIcon(getPersonMarkerIcon(personData, groupColor));
}