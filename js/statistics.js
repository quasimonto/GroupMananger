// Statistics functionality

// Show statistics modal
// Update the updateAllStatistics function to include family statistics

function updateAllStatistics() {
    // Update people statistics
    updatePeopleStatistics();
    
    // Update location statistics
    updateLocationStatistics();
    
    // Update groups overview
    updateGroupsOverview();
    
    // Add family statistics
    updateFamilyStatistics();
}

// Add a new count to the existing people statistics for publishers
function updatePeopleStatistics() {
    // Count roles
    const elderCount = persons.filter(p => p.elder).length;
    const servantCount = persons.filter(p => p.servant).length;
    const pioneerCount = persons.filter(p => p.pioneer).length;
    const leaderCount = persons.filter(p => p.leader).length;
    const helperCount = persons.filter(p => p.helper).length;
    const childCount = persons.filter(p => p.child).length;
    const familyHeadCount = persons.filter(p => p.familyHead).length;
    const publisherCount = persons.filter(p => p.publisher).length;
    
    // Update statistics elements
    document.getElementById('stat-total-people').textContent = persons.length;
    document.getElementById('stat-total-elders').textContent = elderCount;
    document.getElementById('stat-total-servants').textContent = servantCount;
    document.getElementById('stat-total-pioneers').textContent = pioneerCount;
    document.getElementById('stat-total-leaders').textContent = leaderCount;
    document.getElementById('stat-total-helpers').textContent = helperCount;
    document.getElementById('stat-total-children').textContent = childCount;
    document.getElementById('stat-total-familyheads').textContent = familyHeadCount;
    
    // Add publisher count if the element exists
    const publisherStat = document.getElementById('stat-total-publishers-main');
    if (publisherStat) {
        publisherStat.textContent = publisherCount;
    } else {
        // Create publisher stat if it doesn't exist
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            const publisherItem = document.createElement('div');
            publisherItem.className = 'stat-item';
            publisherItem.innerHTML = `
                <span class="stat-label">Publishers:</span>
                <span id="stat-total-publishers-main" class="stat-value">${publisherCount}</span>
            `;
            statsGrid.appendChild(publisherItem);
        }
    }
}
// Update location statistics
function updateLocationStatistics() {
    // Count groups and meeting points
    const totalGroups = groups.length;
    const totalMeetings = meetingPoints.length;
    
    // Count people in groups and not in groups
    const peopleInGroups = persons.filter(p => p.group !== null).length;
    const peopleNotInGroups = persons.length - peopleInGroups;
    
    // Update statistics elements
    document.getElementById('stat-total-groups').textContent = totalGroups;
    document.getElementById('stat-total-meetings').textContent = totalMeetings;
    document.getElementById('stat-people-in-groups').textContent = peopleInGroups;
    document.getElementById('stat-people-not-in-groups').textContent = peopleNotInGroups;
}

// Update groups overview
function updateGroupsOverview() {
    const groupsList = document.getElementById('groups-statistics-list');
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-list-message">No groups created yet</div>';
        return;
    }
    
    // Sort groups by name
    const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a group statistics item for each group
    sortedGroups.forEach(group => {
        // Find all persons in the group
        const groupPersons = persons.filter(p => p.group === group.id);
        
        const item = document.createElement('div');
        item.className = 'group-stat-item';
        
        item.innerHTML = `
            <div class="group-stat-header">
                <div class="group-stat-name">
                    <span class="group-color-indicator" style="background-color: ${group.color};"></span>
                    ${group.name}
                </div>
                <button class="view-group-btn" data-id="${group.id}">View</button>
            </div>
            <div class="group-stat-details">
                <span class="group-stat-detail">${groupPersons.length} Members</span>
            </div>
        `;
        
        groupsList.appendChild(item);
    });
}

// Add statistics button to the map
// Fixed version of initStatistics function
function initStatistics() {
    // Add the statistics button
    addStatisticsButton();
    
    // Set up close button handler
    const closeButton = document.getElementById('close-statistics');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.getElementById('statistics-modal').style.display = 'none';
        });
    }
}

// Add the missing showStatisticsModal function if it doesn't exist
function showStatisticsModal() {
    // Update all statistics
    updateAllStatistics();
    
    // Show the modal
    const modal = document.getElementById('statistics-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('Statistics modal not found');
    }
}


// Initialize statistics functionality
function initStatistics() {
    // Add the statistics button
    addStatisticsButton();
    
    // Set up close button handler
    document.getElementById('close-statistics').addEventListener('click', () => {
        document.getElementById('statistics-modal').style.display = 'none';
    });
}

// Add a new function for family statistics
function updateFamilyStatistics() {
    // Create container for family statistics if it doesn't exist
    let familyStatsSection = document.querySelector('.stat-section.family-stats');
    if (!familyStatsSection) {
        const container = document.querySelector('.statistics-container');
        if (!container) return;
        
        familyStatsSection = document.createElement('div');
        familyStatsSection.className = 'stat-section family-stats';
        familyStatsSection.innerHTML = `
            <h4>Family Statistics</h4>
            <div class="stats-grid family-stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Total Families:</span>
                    <span id="stat-total-families" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Family Heads:</span>
                    <span id="stat-total-family-heads" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Spouses:</span>
                    <span id="stat-total-spouses" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Children:</span>
                    <span id="stat-total-children-in-families" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average Family Size:</span>
                    <span id="stat-avg-family-size" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">People in Families:</span>
                    <span id="stat-people-in-families" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">People not in Families:</span>
                    <span id="stat-people-without-family" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Publishers:</span>
                    <span id="stat-total-publishers" class="stat-value">0</span>
                </div>
            </div>
            <div id="families-statistics-list" class="statistics-list">
                <!-- Family statistics will be listed here -->
            </div>
        `;
        
        // Insert before the groups overview
        const groupsSection = document.querySelector('.stat-section:last-child');
        if (groupsSection) {
            container.insertBefore(familyStatsSection, groupsSection);
        } else {
            container.appendChild(familyStatsSection);
        }
    }
    
    // Calculate family statistics
    const totalFamilies = families ? families.length : 0;
    const peopleWithFamily = persons.filter(p => p.familyId).length;
    const peopleWithoutFamily = persons.length - peopleWithFamily;
    const familyHeads = persons.filter(p => p.familyRole === 'head').length;
    const spouses = persons.filter(p => p.familyRole === 'spouse').length;
    const childrenInFamilies = persons.filter(p => p.familyRole === 'child').length;
    const publishers = persons.filter(p => p.publisher).length;
    
    // Calculate average family size
    let avgFamilySize = 0;
    if (totalFamilies > 0) {
        const familySizes = families.map(family => {
            let size = 0;
            if (family.headId) size++;
            if (family.spouseId) size++;
            size += family.childrenIds.length;
            return size;
        });
        avgFamilySize = (familySizes.reduce((sum, size) => sum + size, 0) / totalFamilies).toFixed(1);
    }
    
    // Update statistics elements
    document.getElementById('stat-total-families').textContent = totalFamilies;
    document.getElementById('stat-total-family-heads').textContent = familyHeads;
    document.getElementById('stat-total-spouses').textContent = spouses;
    document.getElementById('stat-total-children-in-families').textContent = childrenInFamilies;
    document.getElementById('stat-avg-family-size').textContent = avgFamilySize;
    document.getElementById('stat-people-in-families').textContent = peopleWithFamily;
    document.getElementById('stat-people-without-family').textContent = peopleWithoutFamily;
    document.getElementById('stat-total-publishers').textContent = publishers;
    
    // Update family list
    updateFamiliesStatisticsList();
}

// Add a function to show detailed family statistics
function updateFamiliesStatisticsList() {
    const familiesListDiv = document.getElementById('families-statistics-list');
    if (!familiesListDiv) return;
    
    familiesListDiv.innerHTML = '';
    
    if (!families || families.length === 0) {
        familiesListDiv.innerHTML = '<div class="empty-list-message">No families created yet</div>';
        return;
    }
    
    // Sort families by name
    const sortedFamilies = [...families].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedFamilies.forEach(family => {
        const members = getFamilyMembers(family.id);
        if (!members) return;
        
        const familyItem = document.createElement('div');
        familyItem.className = 'family-stat-item';
        
        // Get family role counts
        const elderCount = members.children.filter(p => p.elder).length + 
                           (members.head && members.head.elder ? 1 : 0) + 
                           (members.spouse && members.spouse.elder ? 1 : 0);
        
        const servantCount = members.children.filter(p => p.servant).length + 
                             (members.head && members.head.servant ? 1 : 0) + 
                             (members.spouse && members.spouse.servant ? 1 : 0);
        
        const pioneerCount = members.children.filter(p => p.pioneer).length + 
                             (members.head && members.head.pioneer ? 1 : 0) + 
                             (members.spouse && members.spouse.pioneer ? 1 : 0);
                             
        const publisherCount = members.children.filter(p => p.publisher).length + 
                               (members.head && members.head.publisher ? 1 : 0) + 
                               (members.spouse && members.spouse.publisher ? 1 : 0);
        
        familyItem.innerHTML = `
            <div class="family-stat-header">
                <div class="family-stat-name">
                    <span class="family-color-indicator" style="background-color: ${family.color};"></span>
                    ${family.name}
                </div>
                <button class="view-family-btn" data-id="${family.id}">View</button>
            </div>
            <div class="family-stat-details">
                <span class="family-stat-detail">Total: ${(members.children.length + (members.head ? 1 : 0) + (members.spouse ? 1 : 0))}</span>
                ${elderCount > 0 ? `<span class="family-stat-detail">Elders: ${elderCount}</span>` : ''}
                ${servantCount > 0 ? `<span class="family-stat-detail">Servants: ${servantCount}</span>` : ''}
                ${pioneerCount > 0 ? `<span class="family-stat-detail">Pioneers: ${pioneerCount}</span>` : ''}
                ${publisherCount > 0 ? `<span class="family-stat-detail">Publishers: ${publisherCount}</span>` : ''}
            </div>
        `;
        
        // Add event listener to view button
        familyItem.querySelector('.view-family-btn').addEventListener('click', () => {
            document.getElementById('statistics-modal').style.display = 'none';
            viewFamily(family.id);
        });
        
        familiesListDiv.appendChild(familyItem);
    });
}


// Fixed version of addStatisticsButton function
function addStatisticsButton() {
    // Create the button if it doesn't exist
    if (!document.getElementById('statistics-button')) {
        const button = document.createElement('div');
        button.id = 'statistics-button';
        button.className = 'stats-button';
        button.title = 'Show Statistics';
        button.innerHTML = '📊';
        
        // Make sure showStatisticsModal is defined before using it
        if (typeof window.showStatisticsModal === 'function') {
            button.addEventListener('click', window.showStatisticsModal);
        } else {
            // Use the local function if the global one isn't available
            button.addEventListener('click', showStatisticsModal);
        }
        
        // Add to the map container
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.appendChild(button);
        } else {
            console.error('Map container not found');
        }
    }
}

// Make sure the functions are globally available
window.showStatisticsModal = showStatisticsModal;
window.addStatisticsButton = addStatisticsButton;
window.initStatistics = initStatistics;

// Initialize statistics when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we've already initialized statistics
    if (!window.statisticsInitialized) {
        initStatistics();
        window.statisticsInitialized = true;
    }
});

// Add to initialization
document.addEventListener('DOMContentLoaded', initStatistics);