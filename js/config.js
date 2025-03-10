
// Global variables and configuration
let map;
let autocomplete;
let mapClickMode = null; // 'person', 'meeting', or null

// Remove the activeFilters declaration
// Instead, extend the one in filter.js with additional properties

// Data storage
let persons = [];
let meetingPoints = [];
let groups = [];

// Selected item references
let selectedPerson = null;
let selectedMeeting = null;

// Remove MAX_AUTO_GROUP_DISTANCE declaration from here