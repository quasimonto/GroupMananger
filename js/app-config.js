// Application configuration management

// Application configuration management

// Default configuration
const DEFAULT_CONFIG = {
    // Appearance settings
    appearance: {
        person: {
            icon: 'default',
            color: '#FF0000'
        },
        meeting: {
            icon: 'blue-dot',
            color: '#0000FF'
        },
        group: {
            style: 'circle'
        }
    },
   // Auto-grouping settings
   autoGrouping: {
    distanceThreshold: 1.0, // in kilometers
    minGroupSize: 2,
    maxGroupSize: 20,
    maxGroupSizeDifference: 5,
    keepFamiliesTogether: true, // New option for families
    requirements: {
        minElders: 0,
        minServants: 0,
        minPioneers: 0,
        minLeaders: 1,
        minHelpers: 1,
        minPublishers: 0 // New requirement for publishers
        }
    },
};

// Current configuration (start with defaults)
// Use var instead of let to avoid redeclaration
let appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));




// Try to load saved configuration from localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('mapAppConfig');
    if (savedConfig) {
        try {
            appConfig = JSON.parse(savedConfig);
            
            // Add new properties if they don't exist (backward compatibility)
            if (!appConfig.autoGrouping.requirements.minLeaders) {
                appConfig.autoGrouping.requirements.minLeaders = 1;
            }
            if (!appConfig.autoGrouping.requirements.minHelpers) {
                appConfig.autoGrouping.requirements.minHelpers = 1;
            }
        } catch (e) {
            console.error('Error loading saved configuration:', e);
            appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }
    

    
    // Apply loaded configuration to UI
    applyConfigToUI();
}

// Save current configuration to localStorage
function saveConfig() {
    localStorage.setItem('mapAppConfig', JSON.stringify(appConfig));
}

// Apply current configuration to UI elements
function applyConfigToUI() {
    // Set appearance tab values
    document.getElementById('person-icon-select').value = appConfig.appearance.person.icon;
    document.getElementById('person-color').value = appConfig.appearance.person.color;
    document.getElementById('meeting-icon-select').value = appConfig.appearance.meeting.icon;
    document.getElementById('meeting-color').value = appConfig.appearance.meeting.color;
    document.getElementById('group-icon-select').value = appConfig.appearance.group.style;
    
    // Set auto-grouping tab values
    document.getElementById('distance-threshold').value = appConfig.autoGrouping.distanceThreshold;
    document.getElementById('min-group-size').value = appConfig.autoGrouping.minGroupSize;
    document.getElementById('max-group-size').value = appConfig.autoGrouping.maxGroupSize || 20;
    document.getElementById('min-elders').value = appConfig.autoGrouping.requirements.minElders;
    document.getElementById('min-servants').value = appConfig.autoGrouping.requirements.minServants;
    document.getElementById('min-pioneers').value = appConfig.autoGrouping.requirements.minPioneers;
    document.getElementById('min-leaders').value = appConfig.autoGrouping.requirements.minLeaders;
    document.getElementById('min-helpers').value = appConfig.autoGrouping.requirements.minHelpers;
    document.getElementById('keep-families-together').checked = 
    appConfig.autoGrouping.keepFamiliesTogether !== undefined ? 
    appConfig.autoGrouping.keepFamiliesTogether : true;
    document.getElementById('min-publishers').value = appConfig.autoGrouping.requirements.minPublishers || 0;

}

// Read configuration from UI elements
function readConfigFromUI() {
    // Read appearance tab values
    appConfig.appearance.person.icon = document.getElementById('person-icon-select').value;
    appConfig.appearance.person.color = document.getElementById('person-color').value;
    appConfig.appearance.meeting.icon = document.getElementById('meeting-icon-select').value;
    appConfig.appearance.meeting.color = document.getElementById('meeting-color').value;
    appConfig.appearance.group.style = document.getElementById('group-icon-select').value;
    
    // Read auto-grouping tab values
    appConfig.autoGrouping.distanceThreshold = parseFloat(document.getElementById('distance-threshold').value);
    appConfig.autoGrouping.minGroupSize = parseInt(document.getElementById('min-group-size').value);
    appConfig.autoGrouping.maxGroupSize = parseInt(document.getElementById('max-group-size').value);
    appConfig.autoGrouping.maxGroupSizeDifference = parseInt(document.getElementById('max-group-size-difference').value);
    appConfig.autoGrouping.keepFamiliesTogether = document.getElementById('keep-families-together').checked;
    appConfig.autoGrouping.requirements.minPublishers = parseInt(document.getElementById('min-publishers').value || '0');
    appConfig.autoGrouping.requirements.minElders = parseInt(document.getElementById('min-elders').value);
    appConfig.autoGrouping.requirements.minServants = parseInt(document.getElementById('min-servants').value);
    appConfig.autoGrouping.requirements.minPioneers = parseInt(document.getElementById('min-pioneers').value);
    appConfig.autoGrouping.requirements.minLeaders = parseInt(document.getElementById('min-leaders').value);
    appConfig.autoGrouping.requirements.minHelpers = parseInt(document.getElementById('min-helpers').value);
    

}

// Reset configuration to defaults
function resetConfig() {
    appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    applyConfigToUI();
    saveConfig();
    
    // Update all visual elements
    updateMarkerColors();
    
    // Update MAX_AUTO_GROUP_DISTANCE
    MAX_AUTO_GROUP_DISTANCE = appConfig.autoGrouping.distanceThreshold / 111;
}

// Get marker icon based on configuration
function getPersonMarkerIcon(person, groupColor = null) {
    // If person is in a group, use group styling
    if (person.group && groupColor) {
        switch (appConfig.appearance.group.style) {
            case 'circle':
                return {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'square':
                return {
                    path: 'M -8,-8 8,-8 8,8 -8,8 z',
                    scale: 1,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'star':
                return {
                    path: 'M 0,-10 2,-3 10,-3 4,1 6,9 0,4 -6,9 -4,1 -10,-3 -2,-3 z',
                    scale: 1,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'custom-color':
                // Just use default marker with custom color
                return {
                    url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,
                    scaledSize: new google.maps.Size(32, 32)
                };
            default:
                return null; // Default marker
        }
    }
    
    // Not in a group, use person default styling
    switch (appConfig.appearance.person.icon) {
        case 'circle':
            return {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'square':
            return {
                path: 'M -8,-8 8,-8 8,8 -8,8 z',
                scale: 1,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'star':
            return {
                path: 'M 0,-10 2,-3 10,-3 4,1 6,9 0,4 -6,9 -4,1 -10,-3 -2,-3 z',
                scale: 1,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'person':
            return {
                path: 'M 0,0 c -2.1,0 -3.8,1.7 -3.8,3.8 0,2.1 1.7,3.8 3.8,3.8 2.1,0 3.8,-1.7 3.8,-3.8 0,-2.1 -1.7,-3.8 -3.8,-3.8 z M 0,10.5 c -2.5,0 -7.5,1.3 -7.5,3.8 v 1.8 H 7.5 v -1.8 c 0,-2.5 -5,-3.8 -7.5,-3.8 z',
                scale: 1.2,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'default':
        default:
            return null; // Default Google marker
    }
}

// Similar function for meeting marker icons
function getMeetingMarkerIcon(meeting, groupColor = null) {
    // If meeting is in a group, use group styling
    if (meeting.group && groupColor) {
        // For meeting points in groups, we keep them blue but might scale them differently
        return {
            url: `https://maps.google.com/mapfiles/ms/icons/blue-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
        };
    }
    
    // Not in a group, use meeting default styling
    switch (appConfig.appearance.meeting.icon) {
        case 'blue-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            };
        case 'green-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            };
        case 'purple-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
            };
        case 'flag':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/flag.png'
            };
        case 'info':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/info.png'
            };
        default:
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            };
    }
}

// Setup configuration UI tabs
function setupConfigTabs() {
    const tabButtons = document.querySelectorAll('#config-modal .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#config-modal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize configuration-related event listeners
function initConfigListeners() {
    // Open configuration modal
    document.getElementById('open-config').addEventListener('click', () => {
        // Make sure UI reflects current config
        applyConfigToUI();
        document.getElementById('config-modal').style.display = 'flex';
    });
    
    // Save configuration
    document.getElementById('save-config').addEventListener('click', () => {
        // Read values from UI
        readConfigFromUI();
        
        // Save to local storage
        saveConfig();
        
        // Apply changes to all existing markers
        updateMarkerColors();
        
        // Close modal
        document.getElementById('config-modal').style.display = 'none';
    });
    
    // Cancel configuration changes
    document.getElementById('cancel-config').addEventListener('click', () => {
        // Revert to saved config without saving
        applyConfigToUI();
        document.getElementById('config-modal').style.display = 'none';
    });
    
    // Reset to defaults
    document.getElementById('reset-config').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            resetConfig();
        }
    });
    
    // Setup tabs in the configuration modal
    setupConfigTabs();
}

// Load configuration when the application starts
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    initConfigListeners();
});