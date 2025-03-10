// ======= FAMILY RELATIONSHIPS SYSTEM =======
// This file implements a family relationship management system that allows:
// 1. Creating family units with a family head, spouse, and children
// 2. Managing these relationships through a new modal interface
// 3. Visualizing family connections on the map
// 4. Using family data when creating groups

// ======= DATA MODEL EXTENSIONS =======

// Also update extendPersonModel to properly initialize the relationship fields
function extendPersonModel() {
    // Add new properties to existing persons
    persons.forEach(person => {
      if (!person.hasOwnProperty('familyId')) {
        person.familyId = null;        // The family this person belongs to
        person.familyRole = null;      // 'head', 'spouse', or 'child'
        person.relationshipIds = [];   // IDs of related persons (spouse ID or parent IDs)
      }
      
      // Ensure the relationshipIds is initialized as an array
      if (!person.relationshipIds) {
        person.relationshipIds = [];
      }
    });
  }

// Data structure for families
let families = [];

// Family object structure
function createFamily(headId, name = null) {
  const familyHead = persons.find(p => p.id === headId);
  if (!familyHead) return null;
  
  const familyName = name || `${familyHead.name}'s Family`;
  
  const family = {
    id: 'family_' + Date.now(),
    name: familyName,
    headId: headId,
    spouseId: null,
    childrenIds: [],
    color: getRandomColor()
  };
  
  // Update the family head's properties
  familyHead.familyId = family.id;
  familyHead.familyHead = true;
  familyHead.familyRole = 'head';
  
  families.push(family);
  return family;
}

// Update the addSpouseToFamily function to handle null cases
function addSpouseToFamily(familyId, personId) {
    // Check if both parameters are provided
    if (!familyId || !personId) return false;
    
    const family = families.find(f => f.id === familyId);
    const person = persons.find(p => p.id === personId);
    
    if (!family || !person) return false;
    if (family.spouseId) return false; // Family already has a spouse
    
    // Update family
    family.spouseId = personId;
    
    // Update person
    person.familyId = familyId;
    person.familyRole = 'spouse';
    person.spouse = true;
    
    // Initialize relationshipIds if it doesn't exist
    if (!person.relationshipIds) {
      person.relationshipIds = [];
    }
    
    // Relate to the head
    person.relationshipIds = [family.headId];
    
    // Update family head to relate to spouse
    const head = persons.find(p => p.id === family.headId);
    if (head) {
      // Initialize relationshipIds if it doesn't exist
      if (!head.relationshipIds) {
        head.relationshipIds = [];
      }
      
      if (!head.relationshipIds.includes(personId)) {
        head.relationshipIds.push(personId);
      }
    }
    
    return true;
  }

// Also update addChildToFamily to protect against null values
function addChildToFamily(familyId, personId) {
    // Check if both parameters are provided
    if (!familyId || !personId) return false;
    
    const family = families.find(f => f.id === familyId);
    const person = persons.find(p => p.id === personId);
    
    if (!family || !person) return false;
    if (family.childrenIds.includes(personId)) return false; // Already a child in this family
    
    // Update family
    family.childrenIds.push(personId);
    
    // Update person
    person.familyId = familyId;
    person.familyRole = 'child';
    person.child = true;
    
    // Initialize relationshipIds if it doesn't exist
    if (!person.relationshipIds) {
      person.relationshipIds = [];
    }
    
    // Set relationships to parents
    person.relationshipIds = [family.headId];
    if (family.spouseId) {
      person.relationshipIds.push(family.spouseId);
    }
    
    return true;
  }
// Remove a person from a family
function removePersonFromFamily(personId) {
  const person = persons.find(p => p.id === personId);
  if (!person || !person.familyId) return false;
  
  const family = families.find(f => f.id === person.familyId);
  if (!family) return false;
  
  const familyRole = person.familyRole;
  
  // Handle removal based on role
  if (familyRole === 'head') {
    // If head is removed, the family is dissolved unless there's a spouse to take over
    if (family.spouseId) {
      // Promote spouse to head
      const spouse = persons.find(p => p.id === family.spouseId);
      if (spouse) {
        family.headId = family.spouseId;
        family.spouseId = null;
        spouse.familyRole = 'head';
        spouse.familyHead = true;
        spouse.spouse = false;
      }
    } else {
      // No spouse, so dissolve the family
      dissolveFamily(family.id);
      return true;
    }
  } else if (familyRole === 'spouse') {
    // Remove spouse from family
    family.spouseId = null;
    
    // Remove relationship from head
    const head = persons.find(p => p.id === family.headId);
    if (head) {
      head.relationshipIds = head.relationshipIds.filter(id => id !== personId);
    }
  } else if (familyRole === 'child') {
    // Remove child from family
    family.childrenIds = family.childrenIds.filter(id => id !== personId);
  }
  
  // Reset person's family data
  person.familyId = null;
  person.familyRole = null;
  person.relationshipIds = [];
  
  // Reset role flags based on family role
  if (familyRole === 'head') person.familyHead = false;
  if (familyRole === 'spouse') person.spouse = false;
  if (familyRole === 'child') person.child = false;
  
  return true;
}

// Completely dissolve a family
function dissolveFamily(familyId) {
  const family = families.find(f => f.id === familyId);
  if (!family) return false;
  
  // Reset the family head
  const head = persons.find(p => p.id === family.headId);
  if (head) {
    head.familyId = null;
    head.familyRole = null;
    head.familyHead = false;
    head.relationshipIds = [];
  }
  
  // Reset the spouse
  if (family.spouseId) {
    const spouse = persons.find(p => p.id === family.spouseId);
    if (spouse) {
      spouse.familyId = null;
      spouse.familyRole = null;
      spouse.spouse = false;
      spouse.relationshipIds = [];
    }
  }
  
  // Reset all children
  family.childrenIds.forEach(childId => {
    const child = persons.find(p => p.id === childId);
    if (child) {
      child.familyId = null;
      child.familyRole = null;
      child.child = false;
      child.relationshipIds = [];
    }
  });
  
  // Remove the family from the array
  const index = families.findIndex(f => f.id === familyId);
  if (index !== -1) {
    families.splice(index, 1);
  }
  
  return true;
}

// Get family members as an object with head, spouse, and children
function getFamilyMembers(familyId) {
  const family = families.find(f => f.id === familyId);
  if (!family) return null;
  
  return {
    head: persons.find(p => p.id === family.headId),
    spouse: family.spouseId ? persons.find(p => p.id === family.spouseId) : null,
    children: family.childrenIds.map(id => persons.find(p => p.id === id)).filter(p => p !== undefined)
  };
}

// Serialize families for export
function exportFamilies() {
  return families.map(family => ({
    id: family.id,
    name: family.name,
    headId: family.headId,
    spouseId: family.spouseId,
    childrenIds: [...family.childrenIds],
    color: family.color
  }));
}

// Import families from data
function importFamilies(familiesData) {
  // Reset existing families
  families = [];
  
  // Reset family data in persons
  persons.forEach(person => {
    person.familyId = null;
    person.familyRole = null;
    person.relationshipIds = [];
  });
  
  // Import families
  familiesData.forEach(familyData => {
    const family = {
      id: familyData.id,
      name: familyData.name,
      headId: familyData.headId,
      spouseId: familyData.spouseId,
      childrenIds: [...familyData.childrenIds],
      color: familyData.color
    };
    
    families.push(family);
    
    // Update head
    const head = persons.find(p => p.id === family.headId);
    if (head) {
      head.familyId = family.id;
      head.familyRole = 'head';
      head.familyHead = true;
      head.relationshipIds = family.spouseId ? [family.spouseId] : [];
    }
    
    // Update spouse
    if (family.spouseId) {
      const spouse = persons.find(p => p.id === family.spouseId);
      if (spouse) {
        spouse.familyId = family.id;
        spouse.familyRole = 'spouse';
        spouse.spouse = true;
        spouse.relationshipIds = [family.headId];
      }
    }
    
    // Update children
    family.childrenIds.forEach(childId => {
      const child = persons.find(p => p.id === childId);
      if (child) {
        child.familyId = family.id;
        child.familyRole = 'child';
        child.child = true;
        child.relationshipIds = [family.headId];
        if (family.spouseId) {
          child.relationshipIds.push(family.spouseId);
        }
      }
    });
  });
}

// ======= UI FOR FAMILY MANAGEMENT =======

// Add a tab for family management in the sidebar
function addFamilyManagementTab() {
  // Add the new tab button
  const tabButtons = document.querySelector('.tab-buttons');
  const familyTabButton = document.createElement('button');
  familyTabButton.className = 'tab-button';
  familyTabButton.setAttribute('data-tab', 'families-tab');
  familyTabButton.textContent = 'Families';
  tabButtons.appendChild(familyTabButton);
  
  // Add the new tab content
  const tabContainer = document.querySelector('.tab-container');
  const familiesTab = document.createElement('div');
  familiesTab.id = 'families-tab';
  familiesTab.className = 'tab-content';
  
  familiesTab.innerHTML = `
    <div class="action-buttons">
      <button id="create-family-btn">Create Family</button>
      <button id="manage-families-btn">Manage Families</button>
    </div>
    <div class="family-list" id="family-list">
      <!-- Families will be listed here -->
    </div>
  `;
  
  tabContainer.appendChild(familiesTab);
  
  // Update the tab navigation setup
  setupTabNavigation();
  
  // Add event listeners for the new buttons
  document.getElementById('create-family-btn').addEventListener('click', showCreateFamilyModal);
  document.getElementById('manage-families-btn').addEventListener('click', showManageFamiliesModal);
  
  // Initialize the family list
  updateFamiliesList();
}

// Update the families list in the sidebar
function updateFamiliesList() {
  const familyList = document.getElementById('family-list');
  if (!familyList) return;
  
  familyList.innerHTML = '';
  
  if (families.length === 0) {
    familyList.innerHTML = '<div class="empty-list-message">No families created yet</div>';
    return;
  }
  
  families.forEach(family => {
    const item = document.createElement('div');
    item.className = 'family-item';
    item.style.borderLeft = `4px solid ${family.color}`;
    
    const members = getFamilyMembers(family.id);
    const childCount = members && members.children ? members.children.length : 0;
    
    item.innerHTML = `
      <div class="family-info">
        <div class="family-name">${family.name}</div>
        <div class="family-members-count">
          ${members && members.head ? members.head.name : 'No head'}
          ${members && members.spouse ? ' + ' + members.spouse.name : ''}
          ${childCount > 0 ? ` • ${childCount} ${childCount === 1 ? 'child' : 'children'}` : ''}
        </div>
      </div>
      <div class="family-actions">
        <button class="view-family-btn" data-id="${family.id}">View</button>
        <button class="edit-family-btn" data-id="${family.id}">Edit</button>
      </div>
    `;
    
    // Add event listeners
    item.querySelector('.view-family-btn').addEventListener('click', () => {
      viewFamily(family.id);
    });
    
    item.querySelector('.edit-family-btn').addEventListener('click', () => {
      showEditFamilyModal(family.id);
    });
    
    familyList.appendChild(item);
  });
}

// View a family (focus map on family members)
function viewFamily(familyId) {
  const family = families.find(f => f.id === familyId);
  if (!family) return;
  
  const members = getFamilyMembers(familyId);
  if (!members || (!members.head && !members.spouse && members.children.length === 0)) {
    alert('No family members to display');
    return;
  }
  
  // Create bounds that include all family members
  const bounds = new google.maps.LatLngBounds();
  
  // Add head to bounds
  if (members.head) {
    bounds.extend(members.head.marker.getPosition());
    // Highlight temporarily
    highlightMarker(members.head.marker);
  }
  
  // Add spouse to bounds
  if (members.spouse) {
    bounds.extend(members.spouse.marker.getPosition());
    // Highlight temporarily
    highlightMarker(members.spouse.marker);
  }
  
  // Add children to bounds
  members.children.forEach(child => {
    bounds.extend(child.marker.getPosition());
    // Highlight temporarily
    highlightMarker(child.marker);
  });
  
  // Fit map to these bounds
  map.fitBounds(bounds);
  
  // Draw family connections on the map temporarily
  drawFamilyConnections(familyId);
}

// Temporarily highlight a marker
function highlightFamilyMarker(marker, color) {
  // Store original icon and zIndex
  const originalIcon = marker.getIcon();
  const originalZIndex = marker.getZIndex();
  
  // Set a higher z-index to make it appear on top
  marker.setZIndex(1000);
  
  // Create a highlight effect based on marker type
  let highlightIcon;
  
  if (typeof originalIcon === 'object' && originalIcon !== null) {
    // For SVG/path-based icons
    highlightIcon = {
      ...originalIcon,
      strokeWeight: 3,
      strokeColor: color || '#FFFF00'
    };
    
    if (originalIcon.scale) {
      highlightIcon.scale = originalIcon.scale * 1.2;
    }
    
    if (originalIcon.fillColor) {
      highlightIcon.fillColor = color || originalIcon.fillColor;
      highlightIcon.fillOpacity = 0.8;
    }
  } else {
    // For URL-based icons (default fallback)
    highlightIcon = {
      url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      scaledSize: new google.maps.Size(38, 38)
    };
  }
  
  // Apply the highlight icon
  marker.setIcon(highlightIcon);
  
  // Bounce animation
  marker.setAnimation(google.maps.Animation.BOUNCE);
  
  // Stop bouncing after a short time
  setTimeout(() => {
    marker.setAnimation(null);
  }, 700);
  
  // Reset after a delay
  setTimeout(() => {
    marker.setIcon(originalIcon);
    marker.setZIndex(originalZIndex);
  }, 3000);
}

// Draw temporary connections between family members
let familyConnectionLines = [];

function drawFamilyConnections(familyId) {
  // Clear any existing lines
  clearFamilyConnections();
  
  const family = families.find(f => f.id === familyId);
  if (!family) return;
  
  const members = getFamilyMembers(familyId);
  if (!members || !members.head) return;
  
  const headPosition = members.head.marker.getPosition();
  
  // Draw line to spouse if exists
  if (members.spouse) {
    const spousePosition = members.spouse.marker.getPosition();
    const spouseLine = new google.maps.Polyline({
      path: [headPosition, spousePosition],
      geodesic: true,
      strokeColor: family.color,
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: map
    });
    familyConnectionLines.push(spouseLine);
    
    // Highlight spouse marker
    highlightFamilyMarker(members.spouse.marker, family.color);
  }
  
  // Highlight head marker
  highlightFamilyMarker(members.head.marker, family.color);
  
  // Draw lines to children
  members.children.forEach(child => {
    const childPosition = child.marker.getPosition();
    const childLine = new google.maps.Polyline({
      path: [headPosition, childPosition],
      geodesic: true,
      strokeColor: family.color,
      strokeOpacity: 0.5,
      strokeWeight: 2,
      map: map
    });
    familyConnectionLines.push(childLine);
    
    // If there's a spouse, draw line from spouse to child too
    if (members.spouse) {
      const spousePosition = members.spouse.marker.getPosition();
      const spouseChildLine = new google.maps.Polyline({
        path: [spousePosition, childPosition],
        geodesic: true,
        strokeColor: family.color,
        strokeOpacity: 0.5,
        strokeWeight: 2,
        map: map,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 3
          },
          offset: '0',
          repeat: '10px'
        }]
      });
      familyConnectionLines.push(spouseChildLine);
    }
    
    // Highlight child marker
    highlightFamilyMarker(child.marker, family.color);
  });
  
  // Remove the lines after a delay
  setTimeout(clearFamilyConnections, 10000);
}

function clearFamilyConnections() {
  familyConnectionLines.forEach(line => {
    line.setMap(null);
  });
  familyConnectionLines = [];
}

// ======= FAMILY CREATION MODAL =======

// Show the modal for creating a new family
function showCreateFamilyModal() {
  // Create modal if it doesn't exist yet
  if (!document.getElementById('family-modal')) {
    createFamilyModal();
  }
  
  const modal = document.getElementById('family-modal');
  const modalTitle = document.getElementById('family-modal-title');
  
  // Set modal to create mode
  modal.setAttribute('data-mode', 'create');
  modalTitle.textContent = 'Create New Family';
  
  // Reset form fields
  document.getElementById('family-name').value = '';
  
  // Populate available people dropdowns
  updateFamilyHeadDropdown();
  updateFamilySpouseDropdown();
  updateFamilyChildrenSelections();
  
  // Show the modal
  modal.style.display = 'flex';
}

// Show the modal for editing an existing family
function showEditFamilyModal(familyId) {
  // Create modal if it doesn't exist yet
  if (!document.getElementById('family-modal')) {
    createFamilyModal();
  }
  
  const family = families.find(f => f.id === familyId);
  if (!family) return;
  
  const modal = document.getElementById('family-modal');
  const modalTitle = document.getElementById('family-modal-title');
  
  // Set modal to edit mode
  modal.setAttribute('data-mode', 'edit');
  modal.setAttribute('data-family-id', familyId);
  modalTitle.textContent = 'Edit Family';
  
  // Populate form fields
  document.getElementById('family-name').value = family.name;
  
  // Populate available people dropdowns
  updateFamilyHeadDropdown(family.headId);
  updateFamilySpouseDropdown(family.spouseId, family.headId);
  updateFamilyChildrenSelections(family.childrenIds);
  
  // Display family members
  const members = getFamilyMembers(familyId);
  const membersDiv = document.getElementById('family-current-members');
  membersDiv.innerHTML = '';
  
  if (members.head) {
    const headItem = document.createElement('div');
    headItem.className = 'family-member-item head';
    headItem.innerHTML = `
      <span class="member-role">Head:</span> ${members.head.name}
      <button class="remove-member-btn" data-id="${members.head.id}" data-role="head">✕</button>
    `;
    membersDiv.appendChild(headItem);
  }
  
  if (members.spouse) {
    const spouseItem = document.createElement('div');
    spouseItem.className = 'family-member-item spouse';
    spouseItem.innerHTML = `
      <span class="member-role">Spouse:</span> ${members.spouse.name}
      <button class="remove-member-btn" data-id="${members.spouse.id}" data-role="spouse">✕</button>
    `;
    membersDiv.appendChild(spouseItem);
  }
  
  if (members.children && members.children.length > 0) {
    members.children.forEach(child => {
      const childItem = document.createElement('div');
      childItem.className = 'family-member-item child';
      childItem.innerHTML = `
        <span class="member-role">Child:</span> ${child.name}
        <button class="remove-member-btn" data-id="${child.id}" data-role="child">✕</button>
      `;
      membersDiv.appendChild(childItem);
    });
  }
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-member-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const personId = e.target.getAttribute('data-id');
      const role = e.target.getAttribute('data-role');
      
      if (role === 'head') {
        if (confirm('Removing the family head will dissolve the family. Are you sure?')) {
          dissolveFamily(familyId);
          modal.style.display = 'none';
          updateFamiliesList();
        }
      } else {
        removePersonFromFamily(personId);
        showEditFamilyModal(familyId); // Refresh the modal
        updateFamiliesList();
      }
    });
  });
  
  // Show the modal
  modal.style.display = 'flex';
}

// Create the family modal HTML
function createFamilyModal() {
  const modal = document.createElement('div');
  modal.id = 'family-modal';
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-content family-modal-content">
      <h3 id="family-modal-title">Create New Family</h3>
      
      <div class="form-row">
        <label for="family-name">Family Name:</label>
        <input type="text" id="family-name" placeholder="Family Name">
      </div>
      
      <div id="family-current-members" class="family-current-members">
        <!-- Current family members will be listed here in edit mode -->
      </div>
      
      <div class="family-creation-form">
        <div class="form-section">
          <h4>Select Family Head</h4>
          <select id="family-head-select">
            <option value="">-- Select Family Head --</option>
            <!-- People will be populated here -->
          </select>
        </div>
        
        <div class="form-section">
          <h4>Select Spouse (Optional)</h4>
          <select id="family-spouse-select">
            <option value="">-- Select Spouse --</option>
            <!-- People will be populated here -->
          </select>
        </div>
        
        <div class="form-section">
          <h4>Select Children (Optional)</h4>
          <div id="family-children-select" class="children-selection">
            <!-- Checkbox items will be populated here -->
          </div>
        </div>
      </div>
      
      <div class="family-buttons">
        <button id="save-family-btn">Save Family</button>
        <button id="cancel-family-btn">Cancel</button>
        <button id="delete-family-btn" style="display:none;">Delete Family</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('save-family-btn').addEventListener('click', saveFamily);
  document.getElementById('cancel-family-btn').addEventListener('click', () => {
    document.getElementById('family-modal').style.display = 'none';
  });
  document.getElementById('delete-family-btn').addEventListener('click', deleteFamily);
  
  // Add CSS styles for the family modal
  const style = document.createElement('style');
  style.textContent = `
    .family-modal-content {
      width: 500px;
      max-width: 90vw;
    }
    
    .family-creation-form {
      margin: 15px 0;
    }
    
    .form-section {
      margin-bottom: 15px;
    }
    
    .children-selection {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
    }
    
    .children-selection .checkbox-item {
      margin-bottom: 5px;
    }
    
    .family-buttons {
      display: flex;
      justify-content: space-between;
    }
    
    .family-current-members {
      margin: 15px 0;
    }
    
    .family-member-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      margin-bottom: 5px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .family-member-item.head {
      border-left: 4px solid #4285F4;
    }
    
    .family-member-item.spouse {
      border-left: 4px solid #34A853;
    }
    
    .family-member-item.child {
      border-left: 4px solid #FBBC05;
    }
    
    .member-role {
      font-weight: bold;
      margin-right: 5px;
    }
    
    .remove-member-btn {
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 12px;
      cursor: pointer;
    }
    
    .family-list {
      flex: 1;
      overflow-y: auto;
      max-height: 40vh;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .family-item {
      padding: 10px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .family-item:hover {
      background-color: #f5f5f5;
    }
    
    .family-info {
      flex: 1;
    }
    
    .family-name {
      font-weight: bold;
    }
    
    .family-members-count {
      font-size: 0.9em;
      color: #666;
      margin-top: 3px;
    }
    
    .family-actions {
      display: flex;
      gap: 5px;
    }
    
    .view-family-btn, .edit-family-btn {
      padding: 3px 8px;
      font-size: 0.85em;
    }
  `;
  
  document.head.appendChild(style);
  
  // Add event listeners for dynamic selects
  document.getElementById('family-head-select').addEventListener('change', function() {
    updateFamilySpouseDropdown(null, this.value);
  });
}

// Update the dropdown for selecting a family head
function updateFamilyHeadDropdown(selectedHeadId = null) {
    const headSelect = document.getElementById('family-head-select');
    headSelect.innerHTML = '<option value="">-- Select Family Head --</option>';
    
    // Filter people:
    // 1. Priority to people flagged as familyHead
    // 2. Already selected heads (for editing)
    // 3. People not already in a family
    const preferredHeads = persons.filter(p => 
      p.familyHead && (!p.familyId || (selectedHeadId && p.id === selectedHeadId))
    );
    
    const otherCandidates = persons.filter(p => 
      !p.familyHead && 
      !p.familyId && 
      !p.child &&  // Children shouldn't be family heads
      p.id !== selectedHeadId // Don't duplicate the selected head
    );
    
    // Add a separator heading for preferred heads
    if (preferredHeads.length > 0) {
      const preferredGroup = document.createElement('optgroup');
      preferredGroup.label = "Marked as Family Heads";
      
      preferredHeads.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name;
        
        if (selectedHeadId && person.id === selectedHeadId) {
          option.selected = true;
        }
        
        preferredGroup.appendChild(option);
      });
      
      headSelect.appendChild(preferredGroup);
    }
    
    // Add a separator heading for other candidates
    if (otherCandidates.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = "Other Available People";
      
      otherCandidates.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name;
        
        if (selectedHeadId && person.id === selectedHeadId) {
          option.selected = true;
        }
        
        otherGroup.appendChild(option);
      });
      
      headSelect.appendChild(otherGroup);
    }
    
    // If editing and current head doesn't fit the filters
    if (selectedHeadId) {
      const currentHead = persons.find(p => p.id === selectedHeadId);
      if (currentHead && !preferredHeads.includes(currentHead) && !otherCandidates.includes(currentHead)) {
        const option = document.createElement('option');
        option.value = currentHead.id;
        option.textContent = currentHead.name + " (Current Head)";
        option.selected = true;
        headSelect.appendChild(option);
      }
    }
  }
  

// Update the dropdown for selecting a spouse
function updateFamilySpouseDropdown(selectedSpouseId = null, headId = null) {
    const spouseSelect = document.getElementById('family-spouse-select');
    spouseSelect.innerHTML = '<option value="">-- Select Spouse (Optional) --</option>';
    
    // If no head is selected, disable the spouse dropdown
    if (!headId && !document.getElementById('family-head-select').value) {
      spouseSelect.disabled = true;
      return;
    }
    
    spouseSelect.disabled = false;
    
    // Get the head ID
    const selectedHead = headId || document.getElementById('family-head-select').value;
    
    // Filter people:
    // 1. Priority to people flagged as spouse
    // 2. Already selected spouse (for editing)
    // 3. People not already in a family
    // 4. Never include the head
    const preferredSpouses = persons.filter(p => 
      p.spouse && 
      (!p.familyId || (selectedSpouseId && p.id === selectedSpouseId)) && 
      p.id !== selectedHead
    );
    
    const otherCandidates = persons.filter(p => 
      !p.spouse && 
      !p.familyId && 
      !p.child &&  // Children shouldn't be spouses
      p.id !== selectedHead
    );
    
    // Add a separator heading for preferred spouses
    if (preferredSpouses.length > 0) {
      const preferredGroup = document.createElement('optgroup');
      preferredGroup.label = "Marked as Spouses";
      
      preferredSpouses.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name;
        
        if (selectedSpouseId && person.id === selectedSpouseId) {
          option.selected = true;
        }
        
        preferredGroup.appendChild(option);
      });
      
      spouseSelect.appendChild(preferredGroup);
    }
    
    // Add a separator heading for other candidates
    if (otherCandidates.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = "Other Available People";
      
      otherCandidates.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name;
        
        if (selectedSpouseId && person.id === selectedSpouseId) {
          option.selected = true;
        }
        
        otherGroup.appendChild(option);
      });
      
      spouseSelect.appendChild(otherGroup);
    }
    
    // If editing and current spouse doesn't fit the filters
    if (selectedSpouseId) {
      const currentSpouse = persons.find(p => p.id === selectedSpouseId);
      if (currentSpouse && !preferredSpouses.includes(currentSpouse) && !otherCandidates.includes(currentSpouse)) {
        const option = document.createElement('option');
        option.value = currentSpouse.id;
        option.textContent = currentSpouse.name + " (Current Spouse)";
        option.selected = true;
        spouseSelect.appendChild(option);
      }
    }
  }
  

// Update the checkboxes for selecting children
function updateFamilyChildrenSelections(selectedChildrenIds = []) {
    const childrenContainer = document.getElementById('family-children-select');
    childrenContainer.innerHTML = '';
    
    // Get the head and spouse IDs
    const headId = document.getElementById('family-head-select').value;
    const spouseId = document.getElementById('family-spouse-select').value;
    
    if (!headId) {
      childrenContainer.innerHTML = '<p>Please select a family head first</p>';
      return;
    }
    
    // Filter people:
    // 1. Priority to people flagged as children
    // 2. Already selected children (for editing)
    // 3. People not already in a family
    // 4. Never include the head or spouse
    const preferredChildren = persons.filter(p => 
      p.child && 
      (!p.familyId || selectedChildrenIds.includes(p.id)) && 
      p.id !== headId && 
      p.id !== spouseId
    );
    
    const otherCandidates = persons.filter(p => 
      !p.child && 
      !p.familyId && 
      !p.familyHead && // Family heads shouldn't be children
      !p.spouse && // Spouses shouldn't be children
      p.id !== headId && 
      p.id !== spouseId
    );
    
    // Create section for preferred children
    if (preferredChildren.length > 0) {
      const preferredSection = document.createElement('div');
      preferredSection.className = 'children-section';
      preferredSection.innerHTML = '<h5>Marked as Children</h5>';
      
      preferredChildren.forEach(person => {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        
        const isSelected = selectedChildrenIds.includes(person.id);
        
        item.innerHTML = `
          <input type="checkbox" id="child-${person.id}" value="${person.id}" ${isSelected ? 'checked' : ''}>
          <label for="child-${person.id}">${person.name}</label>
        `;
        
        preferredSection.appendChild(item);
      });
      
      childrenContainer.appendChild(preferredSection);
    }
    
    // Create section for other candidates
    if (otherCandidates.length > 0) {
      const othersSection = document.createElement('div');
      othersSection.className = 'children-section';
      othersSection.innerHTML = '<h5>Other Available People</h5>';
      
      otherCandidates.forEach(person => {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        
        const isSelected = selectedChildrenIds.includes(person.id);
        
        item.innerHTML = `
          <input type="checkbox" id="child-${person.id}" value="${person.id}" ${isSelected ? 'checked' : ''}>
          <label for="child-${person.id}">${person.name}</label>
        `;
        
        othersSection.appendChild(item);
      });
      
      childrenContainer.appendChild(othersSection);
    }
    
    // Add current children that don't fit the filters (for editing)
    const currentChildren = selectedChildrenIds
      .map(id => persons.find(p => p.id === id))
      .filter(p => p && !preferredChildren.includes(p) && !otherCandidates.includes(p));
    
    if (currentChildren.length > 0) {
      const currentSection = document.createElement('div');
      currentSection.className = 'children-section';
      currentSection.innerHTML = '<h5>Current Children</h5>';
      
      currentChildren.forEach(person => {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        
        item.innerHTML = `
          <input type="checkbox" id="child-${person.id}" value="${person.id}" checked>
          <label for="child-${person.id}">${person.name} (Current Child)</label>
        `;
        
        currentSection.appendChild(item);
      });
      
      childrenContainer.appendChild(currentSection);
    }
    
    // If no available people to select as children
    if (preferredChildren.length === 0 && otherCandidates.length === 0 && currentChildren.length === 0) {
      childrenContainer.innerHTML = '<p>No available people to select as children</p>';
    }
    
    // Add some additional styling
    const style = document.createElement('style');
    style.textContent = `
      .children-section {
        margin-bottom: 15px;
      }
      
      .children-section h5 {
        margin: 0 0 5px 0;
        font-size: 0.9em;
        font-weight: bold;
        color: #555;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
      }
    `;
    
    document.head.appendChild(style);
  }

// Update saveFamily function to add checks for empty values
function saveFamily() {
    const modal = document.getElementById('family-modal');
    const mode = modal.getAttribute('data-mode');
    const familyId = modal.getAttribute('data-family-id');
    
    const familyName = document.getElementById('family-name').value;
    const headId = document.getElementById('family-head-select').value;
    const spouseId = document.getElementById('family-spouse-select').value;
    
    // Validate required fields
    if (!headId) {
      alert('Please select a family head');
      return;
    }
    
    if (!familyName.trim()) {
      alert('Please enter a family name');
      return;
    }
    
    // Get selected children
    const selectedChildren = [];
    document.querySelectorAll('#family-children-select input[type="checkbox"]:checked').forEach(checkbox => {
      selectedChildren.push(checkbox.value);
    });
    
    if (mode === 'create') {
      // Create a new family
      const family = createFamily(headId, familyName);
      
      if (!family) {
        alert('Failed to create family. Please try again.');
        return;
      }
      
      // Add spouse if selected
      if (spouseId) {
        const result = addSpouseToFamily(family.id, spouseId);
        if (!result) {
          console.warn('Could not add spouse to family');
        }
      }
      
      // Add children if selected
      selectedChildren.forEach(childId => {
        if (childId) {
          const result = addChildToFamily(family.id, childId);
          if (!result) {
            console.warn('Could not add child to family:', childId);
          }
        }
      });
    } else if (mode === 'edit') {
      // Update existing family
      const family = families.find(f => f.id === familyId);
      
      if (!family) {
        alert('Family not found. Please try again.');
        return;
      }
      
      // Update family name
      family.name = familyName;
      
      // Update head if changed
      if (family.headId !== headId) {
        // This is a complex change that requires restructuring the family
        // For simplicity, we'll dissolve and recreate
        dissolveFamily(family.id);
        const newFamily = createFamily(headId, familyName);
        
        if (spouseId) {
          const result = addSpouseToFamily(newFamily.id, spouseId);
          if (!result) {
            console.warn('Could not add spouse to recreated family');
          }
        }
        
        selectedChildren.forEach(childId => {
          if (childId) {
            const result = addChildToFamily(newFamily.id, childId);
            if (!result) {
              console.warn('Could not add child to recreated family:', childId);
            }
          }
        });
      } else {
        // Update spouse if changed
        if (family.spouseId !== spouseId) {
          // Remove old spouse if exists
          if (family.spouseId) {
            const oldSpouse = persons.find(p => p.id === family.spouseId);
            if (oldSpouse) {
              removePersonFromFamily(oldSpouse.id);
            }
          }
          
          // Add new spouse if selected
          if (spouseId) {
            const result = addSpouseToFamily(family.id, spouseId);
            if (!result) {
              console.warn('Could not add new spouse to family');
            }
          }
        }
        
        // Update children
        
        // First, remove children that are no longer selected
        const childrenToRemove = family.childrenIds.filter(id => !selectedChildren.includes(id));
        childrenToRemove.forEach(childId => {
          removePersonFromFamily(childId);
        });
        
        // Then add newly selected children
        const childrenToAdd = selectedChildren.filter(id => !family.childrenIds.includes(id));
        childrenToAdd.forEach(childId => {
          if (childId) {
            const result = addChildToFamily(family.id, childId);
            if (!result) {
              console.warn('Could not add new child to family:', childId);
            }
          }
        });
      }
    }
    
    // Update UI
    updateFamiliesList();
    
    // Close the modal
    modal.style.display = 'none';
  }

// Delete a family
function deleteFamily() {
  const modal = document.getElementById('family-modal');
  const familyId = modal.getAttribute('data-family-id');
  
  if (!familyId) return;
  
  if (confirm('Are you sure you want to delete this family? This will remove all family relationships.')) {
    dissolveFamily(familyId);
    updateFamiliesList();
    modal.style.display = 'none';
  }
}

// ======= FAMILY MANAGEMENT MODAL =======

// Show the modal for managing all families
function showManageFamiliesModal() {
  // Create modal if it doesn't exist yet
  if (!document.getElementById('manage-families-modal')) {
    createManageFamiliesModal();
  }
  
  updateManageFamiliesModalContent();
  
  // Show the modal
  document.getElementById('manage-families-modal').style.display = 'flex';
}

// Create the manage families modal HTML
function createManageFamiliesModal() {
  const modal = document.createElement('div');
  modal.id = 'manage-families-modal';
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-content manage-families-modal-content">
      <div class="modal-header">
        <h3>Manage Families</h3>
        <button id="close-manage-families" class="close-button">×</button>
      </div>
      
      <div class="families-management-container">
        <div class="families-list-container">
          <!-- Families will be listed here -->
        </div>
      </div>
      
      <div class="modal-footer">
        <button id="add-family-from-manage" class="primary-button">Add New Family</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('close-manage-families').addEventListener('click', () => {
    document.getElementById('manage-families-modal').style.display = 'none';
  });
  
  document.getElementById('add-family-from-manage').addEventListener('click', () => {
    document.getElementById('manage-families-modal').style.display = 'none';
    showCreateFamilyModal();
  });
  
  // Add CSS styles for the manage families modal
  const style = document.createElement('style');
  style.textContent = `
    .manage-families-modal-content {
      width: 800px;
      max-width: 90vw;
      max-height: 80vh;
    }
    
    .families-management-container {
      margin: 15px 0;
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .family-group {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f7f7f7;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .family-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .family-group-name {
      font-size: 1.1em;
      font-weight: bold;
      display: flex;
      align-items: center;
    }
    
    .family-color-indicator {
      display: inline-block;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .family-group-actions {
      display: flex;
      gap: 5px;
    }
    
    .family-members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
    }
    
    .family-member-card {
      padding: 10px;
      background-color: white;
      border-radius: 4px;
      border-left: 3px solid #4285F4;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    
    .family-member-card.head {
      border-left-color: #4285F4;
    }
    
    .family-member-card.spouse {
      border-left-color: #34A853;
    }
    
    .family-member-card.child {
      border-left-color: #FBBC05;
    }
    
    .member-name {
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .member-role-indicator {
      display: inline-block;
      padding: 2px 6px;
      font-size: 0.8em;
      border-radius: 10px;
      background-color: #f0f0f0;
      color: #333;
    }
    
    .role-head {
      background-color: #E3F2FD;
      color: #0D47A1;
    }
    
    .role-spouse {
      background-color: #E8F5E9;
      color: #1B5E20;
    }
    
    .role-child {
      background-color: #FFF8E1;
      color: #FF6F00;
    }
    
    .no-families-message {
      padding: 20px;
      text-align: center;
      color: #666;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  `;
  
  document.head.appendChild(style);
}

// Update the content of the manage families modal
function updateManageFamiliesModalContent() {
  const container = document.querySelector('.families-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (families.length === 0) {
    container.innerHTML = `
      <div class="no-families-message">
        <p>No families have been created yet.</p>
        <p>Click "Add New Family" to create your first family.</p>
      </div>
    `;
    return;
  }
  
  // Sort families by name
  const sortedFamilies = [...families].sort((a, b) => a.name.localeCompare(b.name));
  
  sortedFamilies.forEach(family => {
    const familyGroup = document.createElement('div');
    familyGroup.className = 'family-group';
    
    const members = getFamilyMembers(family.id);
    
    familyGroup.innerHTML = `
      <div class="family-group-header">
        <div class="family-group-name">
          <span class="family-color-indicator" style="background-color: ${family.color};"></span>
          ${family.name}
        </div>
        <div class="family-group-actions">
          <button class="edit-family-btn secondary-button" data-id="${family.id}">Edit</button>
          <button class="view-family-map-btn primary-button" data-id="${family.id}">View on Map</button>
        </div>
      </div>
      
      <div class="family-members-grid">
        ${members.head ? `
          <div class="family-member-card head">
            <div class="member-name">${members.head.name}</div>
            <span class="member-role-indicator role-head">Head</span>
          </div>
        ` : ''}
        
        ${members.spouse ? `
          <div class="family-member-card spouse">
            <div class="member-name">${members.spouse.name}</div>
            <span class="member-role-indicator role-spouse">Spouse</span>
          </div>
        ` : ''}
        
        ${members.children.map(child => `
          <div class="family-member-card child">
            <div class="member-name">${child.name}</div>
            <span class="member-role-indicator role-child">Child</span>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners
    familyGroup.querySelector('.edit-family-btn').addEventListener('click', () => {
      document.getElementById('manage-families-modal').style.display = 'none';
      showEditFamilyModal(family.id);
    });
    
    familyGroup.querySelector('.view-family-map-btn').addEventListener('click', () => {
      document.getElementById('manage-families-modal').style.display = 'none';
      viewFamily(family.id);
    });
    
    container.appendChild(familyGroup);
  });
}

// ======= GROUP CREATION WITH FAMILY CONSIDERATION =======

// Extend the group creation logic to consider families
function enhanceGroupCreation() {
    // We no longer need to override autoGroupByArea since it's removed
    // Instead, we'll make sure the meeting-based grouping considers families
    addMeetingBasedGroupingButton();
  }

// Group creation that keeps families together
function autoGroupWithFamilies() {
  if (persons.length < appConfig.autoGrouping.minGroupSize) {
    alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
    return;
  }
  
  // Show loading indicator
  showGroupingLoadingIndicator();
  
  // First, process each family as a unit
  const familyUnits = [];
  const unassignedPersons = [];
  
  // Group persons by family
  families.forEach(family => {
    const members = getFamilyMembers(family.id);
    
    // Skip empty families
    if (!members.head && !members.spouse && members.children.length === 0) {
      return;
    }
    
    // Create a family unit
    const familyUnit = {
      id: family.id,
      name: family.name,
      color: family.color,
      members: [],
      center: null // Will calculate centroid
    };
    
    // Add members to the unit
    if (members.head) {
      familyUnit.members.push(members.head);
    }
    
    if (members.spouse) {
      familyUnit.members.push(members.spouse);
    }
    
    members.children.forEach(child => {
      familyUnit.members.push(child);
    });
    
    // Calculate centroid
    const positions = familyUnit.members.map(person => person.marker.getPosition());
    familyUnit.center = findCentroid(positions);
    
    familyUnits.push(familyUnit);
  });
  
  // Collect unassigned persons
  persons.forEach(person => {
    if (!person.familyId) {
      unassignedPersons.push(person);
    }
  });
  
  // Now group family units and unassigned persons based on proximity
  let ungroupedItems = [
    ...familyUnits.map(unit => ({...unit, type: 'family'})),
    ...unassignedPersons.map(person => ({...person, type: 'person'}))
  ];
  
  let autoGroups = [];
  
  while (ungroupedItems.length > 0) {
    const seed = ungroupedItems[0];
    const group = [seed];
    ungroupedItems.splice(0, 1);
    
    // Get the seed position
    const seedPosition = seed.type === 'family' ? seed.center : seed.marker.getPosition();
    
    for (let i = ungroupedItems.length - 1; i >= 0; i--) {
      const item = ungroupedItems[i];
      const itemPosition = item.type === 'family' ? item.center : item.marker.getPosition();
      
      // Calculate distance between positions
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        seedPosition, itemPosition
      ) / 111000; // Convert to degrees
      
      if (distance <= MAX_AUTO_GROUP_DISTANCE) {
        group.push(item);
        ungroupedItems.splice(i, 1);
      }
    }
    
    // Count total persons in the group
    let totalPersons = group.reduce((count, item) => {
      return count + (item.type === 'family' ? item.members.length : 1);
    }, 0);
    
    // Check if the group meets size requirements
    if (totalPersons >= appConfig.autoGrouping.minGroupSize) {
      autoGroups.push(group);
    } else {
      // Put these items back for potential inclusion in other groups
      ungroupedItems.push(...group);
    }
  }
  
  // If no valid groups could be formed
  if (autoGroups.length === 0) {
    alert("Couldn't create any groups that meet the requirements. Try adjusting your settings.");
    hideGroupingLoadingIndicator();
    return;
  }
  
  // Create actual groups from the clusters
  autoGroups.forEach((groupItems, index) => {
    const groupName = `Group ${index + 1}`;
    const color = getRandomColor();
    const newGroup = createGroup(groupName, color);
    
    // Process all items in the group
    groupItems.forEach(item => {
      if (item.type === 'family') {
        // Assign all family members to this group
        item.members.forEach(person => {
          assignPersonToGroup(person, newGroup.id);
        });
      } else if (item.type === 'person') {
        // Assign individual person
        assignPersonToGroup(item, newGroup.id);
      }
    });
  });
  
  // Update UI
  updatePersonsList();
  updateMarkerColors();
  updateGroupsList();
  
  // Hide loading indicator
  hideGroupingLoadingIndicator();
}

// ======= INITIALIZATION AND INTEGRATION =======

// Modify exportData to include families
const originalExportData = window.exportData || exportData;

// Define our enhanced exportData function
function enhancedExportData() {
  // Create a new export data object
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
        
        // Family relationship data
        familyId: person.familyId || null,
        familyRole: person.familyRole || null,
        relationshipIds: Array.isArray(person.relationshipIds) ? [...person.relationshipIds] : [],
        
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
    })),
    
    // Export families
    families: exportFamilies()
  };

  return exportData;
}

// Create a new function for triggering the export
function triggerExportData() {
  // Generate the export data
  const jsonData = JSON.stringify(enhancedExportData(), null, 2);

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
// Store reference to original import function
const originalImportData = window.importData || importData;

// Create enhanced import function
function enhancedImportData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate the data format
    if (!data.persons || !data.meetingPoints) {
      throw new Error('Invalid data format');
    }
    
    // Clear existing data
    clearAllData();
    
    // Initialize families array if it doesn't exist
    if (typeof families === 'undefined') {
      window.families = [];
    } else {
      // Clear existing families
      families.length = 0;
    }
    
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
          helper: false,
          familyId: null,
          familyRole: null,
          relationshipIds: []
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
          helper: mergedPersonData.helper,
          familyId: mergedPersonData.familyId,
          familyRole: mergedPersonData.familyRole,
          relationshipIds: Array.isArray(mergedPersonData.relationshipIds) ? 
            [...mergedPersonData.relationshipIds] : []
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
    
    // Import families if present
    if (data.families && Array.isArray(data.families)) {
      // Initialize families array
      try {
        importFamilies(data.families);
      } catch (err) {
        console.error('Error importing families:', err);
      }
    }
    
    // Update UI
    updatePersonsList();
    updateMeetingsList();
    updateGroupsList();
    
    // Update families list if it exists
    if (typeof updateFamiliesList === 'function') {
      updateFamiliesList();
    }
    
    // Fit map to all markers
    fitMapToAllMarkers();
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: `Import failed: ${error.message}` };
  }
}


// Initialize the family relationship system
function initFamilySystem() {
  // Add the family management tab
  addFamilyManagementTab();
  
  // Extend the person model to include family relationships
  extendPersonModel();
  
  // Enhance group creation to consider families
  enhanceGroupCreation();
}

// Replace the original exportData function with our enhanced version
window.exportData = triggerExportData;

// Initialize the button click event
document.addEventListener('DOMContentLoaded', () => {
  const exportButton = document.getElementById('export-data');
  if (exportButton) {
    // Remove any existing event listeners
    const newButton = exportButton.cloneNode(true);
    exportButton.parentNode.replaceChild(newButton, exportButton);
    
    // Add our new event listener
    newButton.addEventListener('click', triggerExportData);
  }
});

// Add to initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the family system after a short delay to ensure 
  // the basic app is loaded first
  setTimeout(initFamilySystem, 500);
});


// Replace original importData function
window.importData = enhancedImportData;

// Initialize the button click event
document.addEventListener('DOMContentLoaded', () => {
  // Set up file input handling
  const importFileInput = document.getElementById('import-file-input');
  if (importFileInput) {
    // Remove existing listeners
    const newInput = importFileInput.cloneNode(true);
    importFileInput.parentNode.replaceChild(newInput, importFileInput);
    
    // Add new event handler
    newInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        const result = enhancedImportData(e.target.result);
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
        }
      };
      reader.readAsText(file);
      
      // Reset the file input
      event.target.value = '';
    });
  }
  
  // Set up import button
  const importButton = document.getElementById('import-data');
  if (importButton) {
    // Remove existing listeners
    const newButton = importButton.cloneNode(true);
    importButton.parentNode.replaceChild(newButton, importButton);
    
    // Add new event handler
    newButton.addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
  }
});


// Update person model and UI to include Publisher flag

// 1. Modify addPersonAtLocation function to include publisher flag
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
        leader: false,
        helper: false,
        publisher: false  // Add publisher flag
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

// 2. Update showPersonModal to include publisher checkbox
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
    const leaderCheckbox = document.getElementById('person-leader');
    const helperCheckbox = document.getElementById('person-helper');
    const publisherCheckbox = document.getElementById('person-publisher'); // Get publisher checkbox
    
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
        leaderCheckbox.checked = personData.leader;
        helperCheckbox.checked = personData.helper;
        if (publisherCheckbox) publisherCheckbox.checked = personData.publisher || false;
    } else {
        nameInput.value = 'New Person';
        elderCheckbox.checked = false;
        servantCheckbox.checked = false;
        pioneerCheckbox.checked = false;
        spouseCheckbox.checked = false;
        childCheckbox.checked = false;
        familyHeadCheckbox.checked = false;
        leaderCheckbox.checked = false;
        helperCheckbox.checked = false;
        if (publisherCheckbox) publisherCheckbox.checked = false;
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

// 3. Add publisher checkbox to person modal if it doesn't exist
function addPublisherCheckbox() {
    // Check if we need to add the publisher checkbox
    const roleGroup = document.querySelector('.checkbox-group:first-of-type');
    if (roleGroup && !document.getElementById('person-publisher')) {
        const publisherItem = document.createElement('div');
        publisherItem.className = 'checkbox-item';
        publisherItem.innerHTML = `
            <input type="checkbox" id="person-publisher">
            <label for="person-publisher">Publisher</label>
        `;
        roleGroup.appendChild(publisherItem);
    }
}

// 4. Update save-person event handler to include publisher flag
document.addEventListener('DOMContentLoaded', () => {
    // Add publisher checkbox to person modal
    addPublisherCheckbox();
    
    // Update save person handler
    const originalSaveBtn = document.getElementById('save-person');
    if (originalSaveBtn) {
        // Clone to remove existing event listeners
        const saveBtn = originalSaveBtn.cloneNode(true);
        originalSaveBtn.parentNode.replaceChild(saveBtn, originalSaveBtn);
        
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('person-name').value;
            const groupId = document.getElementById('person-group').value;
            
            const elder = document.getElementById('person-elder').checked;
            const servant = document.getElementById('person-servant').checked;
            const pioneer = document.getElementById('person-pioneer').checked;
            const spouse = document.getElementById('person-spouse').checked;
            const child = document.getElementById('person-child').checked;
            const familyHead = document.getElementById('person-familyhead').checked;
            const leader = document.getElementById('person-leader').checked;
            const helper = document.getElementById('person-helper').checked;
            const publisher = document.getElementById('person-publisher').checked;
            
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
                selectedPerson.leader = leader;
                selectedPerson.helper = helper;
                selectedPerson.publisher = publisher;
                updatePersonColor(selectedPerson);
            }
            
            // Close modal and update list
            document.getElementById('person-modal').style.display = 'none';
            updatePersonsList();
            selectedPerson = null;
        });
    }
});

// 5. Update person list to show publisher status
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
        activeFilters.leader ||
        activeFilters.helper ||
        activeFilters.publisher; // Add publisher filter
        
    if (anyFilterActive) {
        filteredPersons = filteredPersons.filter(person => 
            (activeFilters.elder && person.elder) ||
            (activeFilters.servant && person.servant) ||
            (activeFilters.pioneer && person.pioneer) ||
            (activeFilters.familyHead && person.familyHead) ||
            (activeFilters.leader && person.leader) ||
            (activeFilters.helper && person.helper) ||
            (activeFilters.publisher && person.publisher)
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
        if (personData.publisher) roleIndicators += '<span class="role-tag publisher-tag">Pub</span>';
        
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

// 6. Update filter UI to include publisher filter
function addPublisherFilter() {
    const filterSection = document.querySelector('.filter-section:last-of-type');
    if (filterSection && !document.getElementById('filter-publisher')) {
        const publisherFilter = document.createElement('div');
        publisherFilter.className = 'checkbox-item';
        publisherFilter.innerHTML = `
            <input type="checkbox" id="filter-publisher">
            <label for="filter-publisher">Publisher</label>
        `;
        filterSection.appendChild(publisherFilter);
        
        // Update active filters object
        activeFilters.publisher = false;
        
        // Add event listener for the filter
        document.getElementById('filter-publisher').addEventListener('change', function() {
            activeFilters.publisher = this.checked;
            applyFilters();
        });
    }
}

// 7. Add CSS for publisher tag
function addPublisherStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .publisher-tag {
            background-color: #4A148C;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// Initialize publisher UI elements
document.addEventListener('DOMContentLoaded', () => {
    // Add publisher checkbox to person modal
    addPublisherCheckbox();
    
    // Add publisher filter
    addPublisherFilter();
    
    // Add publisher tag styles
    addPublisherStyles();
    
    // Update existing persons to include publisher property if not present
    persons.forEach(person => {
        if (person.publisher === undefined) {
            person.publisher = false;
        }
    });
});