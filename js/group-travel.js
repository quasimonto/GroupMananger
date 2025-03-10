// Advanced grouping functionality using travel time data

// Auto-group people based on travel time to meeting points

function autoGroupByMeetingPoints() {
    console.log('Auto-grouping by meeting points started');
    console.log('Total persons:', persons.length);
    console.log('Total meeting points:', meetingPoints.length);
    console.log('Minimum group size:', appConfig.autoGrouping.minGroupSize);

    // Check if we have enough people and meeting points
    if (persons.length < appConfig.autoGrouping.minGroupSize) {
        console.warn('Not enough people to create groups');
        alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
        return;
    }
    
    if (meetingPoints.length === 0) {
        console.warn('No meeting points available');
        alert("Need at least one meeting point to create groups");
        return;
    }
    
    // Show loading indicator
    showGroupingLoadingIndicator();
    
    // Calculate travel times for all people to all meeting points
    calculateAllTravelTimes().then(travelData => {
        console.log('Travel data calculated', travelData);
        
        // Create groups based on travel times
        const newGroups = createGroupsFromTravelData(travelData);
        
        console.log('New groups created:', newGroups.length);
        
        // Apply the new groups
        applyNewGroups(newGroups);
        
        // Hide loading indicator
        hideGroupingLoadingIndicator();
    }).catch(error => {
        console.error('Error in travel time calculation:', error);
        alert('Error creating groups. Check console for details.');
        hideGroupingLoadingIndicator();
    });
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


// Calculate travel times for all persons to all meeting points
async function calculateAllTravelTimes() {
    const travelData = {
        personTravelTimes: []
    };
    
    // For each person, calculate travel times to all meeting points
    for (const person of persons) {
        const personData = {
            person: person,
            meetingPointTimes: []
        };
        
        // For each meeting point, calculate travel time
        for (const meeting of meetingPoints) {
            // Calculate straight-line distance in meters
            const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                person.marker.getPosition(), 
                meeting.marker.getPosition()
            );
            
            // Convert to kilometers for display
            const distanceInKm = (distanceInMeters / 1000).toFixed(1);
            
            // Estimate driving time (using the same logic as in travel-time.js)
            let drivingMinutes;
            if (distanceInMeters < 100) {
                drivingMinutes = 0;
            } else if (distanceInMeters < 500) {
                drivingMinutes = Math.max(2, Math.round(distanceInMeters / 1000 / (25/60)));
            } else {
                drivingMinutes = Math.round((distanceInMeters / 1000 / 0.417) + 2);
            }
            
            // Store the travel time data
            personData.meetingPointTimes.push({
                meetingPoint: meeting,
                drivingMinutes: drivingMinutes,
                distanceInKm: parseFloat(distanceInKm)
            });
        }
        
        // Sort meeting points by travel time (shortest first)
        personData.meetingPointTimes.sort((a, b) => a.drivingMinutes - b.drivingMinutes);
        
        // Add to the collection
        travelData.personTravelTimes.push(personData);
    }
    
    return travelData;
}

// Advanced grouping functionality using travel time data

// Create groups based on travel time data with refined rules
function createGroupsFromTravelData(travelData) {
    console.log('Creating groups with refined rules');
    console.log('Auto-grouping configuration:', appConfig.autoGrouping);

    // Initialize array to store the new groups
    const newGroups = [];
    
    // Track assigned persons to ensure each person is in only one group
    const assignedPersonIds = new Set();

     // Pre-process family units if families should be kept together
     let familyUnits = [];
     if (appConfig.autoGrouping.keepFamiliesTogether && families && families.length > 0) {
         console.log('Processing families to keep them together');
         
         // Create a mapping of person IDs to family IDs
         const familyMembership = {};
         families.forEach(family => {
             // Add head
             if (family.headId) {
                 familyMembership[family.headId] = family.id;
             }
             
             // Add spouse
             if (family.spouseId) {
                 familyMembership[family.spouseId] = family.id;
             }
             
             // Add children
             family.childrenIds.forEach(childId => {
                 familyMembership[childId] = family.id;
             });
             
             // Build family unit object
             const familyMembers = persons.filter(p => 
                 p.id === family.headId || 
                 p.id === family.spouseId || 
                 family.childrenIds.includes(p.id)
             );
             
             if (familyMembers.length > 0) {
                 familyUnits.push({
                     id: family.id,
                     members: familyMembers
                 });
             }
         });
         
         console.log('Found', familyUnits.length, 'family units to keep together');
     }
    
    // Find all available leaders and helpers
    const availableLeaders = persons.filter(p => 
        p.leader && !assignedPersonIds.has(p.id)
    );
    
    const availableHelpers = persons.filter(p => 
        p.helper && !assignedPersonIds.has(p.id)
    );
    
    // Sort meeting points by importance or potential group size
    const sortedMeetingPoints = [...meetingPoints];
    
    // Create groups for each meeting point
    for (const meetingPoint of sortedMeetingPoints) {
        // Skip if no leaders or helpers available
        if (availableLeaders.length === 0 || availableHelpers.length === 0) {
            console.log('No more leaders or helpers available');
            break;
        }
        
        // Find travel times for leaders to this meeting point
        const leaderTravelTimes = availableLeaders.map(leader => {
            const leaderData = travelData.personTravelTimes.find(
                data => data.person.id === leader.id
            );
            
            const travelToMeeting = leaderData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                leader: leader,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity
            };
        });
        
        // Sort leaders by travel time (closest first)
        leaderTravelTimes.sort((a, b) => a.travelTime - b.travelTime);
        
        // Select the closest leader
        const selectedLeader = leaderTravelTimes[0].leader;
        
        // Find travel times for helpers to this meeting point
        const helperTravelTimes = availableHelpers.map(helper => {
            const helperData = travelData.personTravelTimes.find(
                data => data.person.id === helper.id
            );
            
            const travelToMeeting = helperData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                helper: helper,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity
            };
        });
        
        // Sort helpers by travel time (closest first)
        helperTravelTimes.sort((a, b) => a.travelTime - b.travelTime);
        
        // Select the closest helper
        const selectedHelper = helperTravelTimes[0].helper;
        
        // Initial group with leader and helper
        const groupPersons = [
            selectedLeader,
            selectedHelper
        ];
        
        // Mark leader and helper as assigned
        assignedPersonIds.add(selectedLeader.id);
        assignedPersonIds.add(selectedHelper.id);
        
        // Remove used leaders and helpers from available pool
        const leaderIndex = availableLeaders.indexOf(selectedLeader);
        if (leaderIndex > -1) availableLeaders.splice(leaderIndex, 1);
        
        const helperIndex = availableHelpers.indexOf(selectedHelper);
        if (helperIndex > -1) availableHelpers.splice(helperIndex, 1);
        
        // Find and add a pioneer (not elder, servant, leader, or helper)
        const availablePioneers = persons.filter(p => 
            p.pioneer && 
            !assignedPersonIds.has(p.id) &&
            !p.elder && 
            !p.servant && 
            !p.leader && 
            !p.helper
        );
        
        // Find pioneers closest to the meeting point
        const pioneerTravelTimes = availablePioneers.map(pioneer => {
            const pioneerData = travelData.personTravelTimes.find(
                data => data.person.id === pioneer.id
            );
            
            const travelToMeeting = pioneerData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                pioneer: pioneer,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity
            };
        }).sort((a, b) => a.travelTime - b.travelTime);
        
        // Add closest pioneer if available
        if (pioneerTravelTimes.length > 0) {
            const selectedPioneer = pioneerTravelTimes[0].pioneer;
            groupPersons.push(selectedPioneer);
            assignedPersonIds.add(selectedPioneer.id);
        }
        
        // Calculate target group size (80% of max group size)
        const targetGroupSize = Math.floor(appConfig.autoGrouping.maxGroupSize * 0.8);
        
        // Find remaining unassigned persons close to the meeting point
        const remainingPersons = persons.filter(p => 
            !assignedPersonIds.has(p.id)
        );
        
        // Find remaining persons' travel times to the meeting point
        const remainingPersonTravelTimes = remainingPersons.map(person => {
            const personData = travelData.personTravelTimes.find(
                data => data.person.id === person.id
            );
            
            const travelToMeeting = personData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                person: person,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity
            };
        }).sort((a, b) => a.travelTime - b.travelTime);
        
        // Add remaining persons until group is close to target size
        for (const personTime of remainingPersonTravelTimes) {
            if (groupPersons.length < targetGroupSize) {
                groupPersons.push(personTime.person);
                assignedPersonIds.add(personTime.person.id);
            } else {
                break;
            }
        }
        
        // Create the group
        const groupName = `Group - ${meetingPoint.name}`;
        const groupColor = getRandomColor();
        const newGroup = createGroup(groupName, groupColor);
        
        // Assign items to this group
        groupPersons.forEach(person => {
            assignPersonToGroup(person, newGroup.id);
        });
        
        // Assign meeting point to group
        assignMeetingToGroup(meetingPoint, newGroup.id);
        
        newGroups.push({
            name: groupName,
            color: groupColor,
            meeting: meetingPoint,
            persons: groupPersons
        });
    }
    
    // Handle any remaining unassigned persons
    const remainingUnassignedPersons = persons.filter(p => !assignedPersonIds.has(p.id));
    
    if (remainingUnassignedPersons.length > 0) {
        console.log('Creating additional groups for remaining unassigned persons');
        const additionalGroups = groupRemainingByProximity(remainingUnassignedPersons);
        newGroups.push(...additionalGroups);
    }
    
    console.log('Total groups created:', newGroups.length);
    return newGroups;
}

// Find persons closest to a meeting point
function findClosestPersons(meetingPoint, persons, travelData, minSize) {
    // Get travel times for all persons to this meeting point
    const personTravelTimes = [];
    
    for (const person of persons) {
        // Find this person's travel data
        const personData = travelData.personTravelTimes.find(
            data => data.person.id === person.id
        );
        
        if (personData) {
            // Find travel time to this meeting point
            const travelInfo = personData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            if (travelInfo) {
                personTravelTimes.push({
                    person: person,
                    drivingMinutes: travelInfo.drivingMinutes,
                    distanceInKm: travelInfo.distanceInKm
                });
            }
        }
    }
    
    // Sort by travel time (shortest first)
    personTravelTimes.sort((a, b) => a.drivingMinutes - b.drivingMinutes);
    
    // Calculate how many people we need to meet role requirements
    let requiredSize = Math.max(
        minSize,
        appConfig.autoGrouping.requirements.minElders,
        appConfig.autoGrouping.requirements.minServants,
        appConfig.autoGrouping.requirements.minPioneers
    );
    
    // Take up to 50% more than required to have a buffer for role requirements
    const maxSize = Math.min(
        Math.ceil(requiredSize * 1.5),
        personTravelTimes.length
    );
    
    // Start with the closest people
    let selectedPersons = personTravelTimes.slice(0, maxSize).map(item => item.person);
    
    // If we don't meet requirements, try adding more people until we do or run out
    while (!groupMeetsRequirements(selectedPersons) && 
           selectedPersons.length < personTravelTimes.length) {
        selectedPersons.push(personTravelTimes[selectedPersons.length].person);
    }
    
    // If we still don't meet requirements, return empty array (can't create group)
    if (!groupMeetsRequirements(selectedPersons)) {
        return [];
    }
    
    // If we have more than minimum size and meet requirements, optimize the group
    if (selectedPersons.length > minSize) {
        // Try to reduce size while still meeting requirements
        for (let i = selectedPersons.length - 1; i >= minSize; i--) {
            const testGroup = selectedPersons.slice(0, i);
            if (groupMeetsRequirements(testGroup)) {
                selectedPersons = testGroup;
            } else {
                break;
            }
        }
    }
    
    return selectedPersons;
}

// Group remaining people by proximity to each other
function groupRemainingByProximity(persons) {
    // Create a copy of persons that we can modify
    let remainingPersons = [...persons];
    const groups = [];
    
    while (remainingPersons.length >= appConfig.autoGrouping.minGroupSize) {
        // Start with the first person
        const seed = remainingPersons[0];
        const group = [seed];
        
        // Remove seed from remaining
        remainingPersons = remainingPersons.filter(p => p.id !== seed.id);
        
        // Find closest people to the seed
        const proximityOrder = remainingPersons.map(person => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                seed.marker.getPosition(),
                person.marker.getPosition()
            );
            return { person, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        // Add people to the group until it meets requirements or we run out
        let currentIdx = 0;
        while (currentIdx < proximityOrder.length) {
            // Add next closest person
            group.push(proximityOrder[currentIdx].person);
            
            // Check if we meet requirements
            if (group.length >= appConfig.autoGrouping.minGroupSize && 
                groupMeetsRequirements(group)) {
                break;
            }
            
            currentIdx++;
        }
        
        // If we have a valid group, save it
        if (group.length >= appConfig.autoGrouping.minGroupSize && 
            groupMeetsRequirements(group)) {
            
            // Find centroid of the group to use as a virtual meeting point
            const positions = group.map(person => person.marker.getPosition());
            const centroid = findCentroid(positions);
            
            // Create a new group
            groups.push({
                name: `Group ${groups.length + 1}`,
                color: getRandomColor(),
                persons: group,
                centroid: centroid
            });
            
            // Remove these people from remaining
            remainingPersons = remainingPersons.filter(
                person => !group.slice(1).some(p => p.id === person.id)
            );
        } else {
            // If we couldn't form a valid group, break the loop
            break;
        }
    }
    
    return groups;
}

// Find the centroid (average position) of a set of points
function findCentroid(positions) {
    if (positions.length === 0) return null;
    
    let sumLat = 0;
    let sumLng = 0;
    
    for (const position of positions) {
        sumLat += position.lat();
        sumLng += position.lng();
    }
    
    return new google.maps.LatLng(
        sumLat / positions.length,
        sumLng / positions.length
    );
}

// Apply the new groups to the model
function applyNewGroups(newGroups) {
    // First, remove all people from existing groups
    persons.forEach(person => {
        person.group = null;
        updatePersonColor(person);
    });
    
    // Then create new groups and assign people
    newGroups.forEach(newGroup => {
        // Create the actual group
        const group = createGroup(newGroup.name, newGroup.color);
        
        // Assign the meeting point to this group if it exists
        if (newGroup.meeting) {
            assignMeetingToGroup(newGroup.meeting, group.id);
        }
        
        // Assign all people to this group
        newGroup.persons.forEach(person => {
            assignPersonToGroup(person, group.id);
        });
    });
    
    // Update UI
    updateGroupsList();
    updatePersonsList();
    updateMeetingsList();
}

// Add button to UI for this new grouping method
function addMeetingBasedGroupingButton() {
    const groupControls = document.querySelector('.group-controls');
    
    // Create button if it doesn't exist
    if (!document.getElementById('auto-group-meeting')) {
        const button = document.createElement('button');
        button.id = 'auto-group-meeting';
        button.textContent = 'Auto Create Groups'; // Changed from 'Auto Group by Meeting Points'
        button.addEventListener('click', previewGroupCreation);
        
        // Add after create group button
        const createButton = document.getElementById('create-group');
        if (createButton && groupControls) {
            groupControls.insertBefore(button, createButton.nextSibling);
        } else if (groupControls) {
            groupControls.appendChild(button);
        }
    }
}
// Detailed group creation process with step-by-step preview
function previewGroupCreation() {
    console.log('Previewing group creation');
    
    // Validate minimum requirements
    if (persons.length < appConfig.autoGrouping.minGroupSize) {
        alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
        return;
    }
    
    if (meetingPoints.length === 0) {
        alert("Need at least one meeting point to create groups");
        return;
    }
    
    // Calculate travel times
    calculateAllTravelTimes().then(travelData => {
        // Generate detailed group creation preview
        const groupCreationSteps = generateGroupCreationPreview(travelData);
        
        // Display preview modal
        displayGroupCreationPreview(groupCreationSteps);
    }).catch(error => {
        console.error('Error in travel time calculation:', error);
        alert('Error previewing groups. Check console for details.');
    });
}

function generateGroupCreationPreview(travelData) {
    const groupCreationSteps = [];
    const assignedPersonIds = new Set();
    
    // Track group sizes to balance them
    const groupSizes = [];
    
    // Determine the initial target group size and size variation
    const targetGroupSize = Math.floor(appConfig.autoGrouping.maxGroupSize * 0.8);
    const maxSizeDifference = appConfig.autoGrouping.maxGroupSizeDifference || 5;
    
    // Sort meeting points 
    const sortedMeetingPoints = [...meetingPoints];
    
    // Create groups for each meeting point
    for (const meetingPoint of sortedMeetingPoints) {
        // Skip if not enough unassigned people to form a group
        const unassignedPersons = persons.filter(p => !assignedPersonIds.has(p.id));
        if (unassignedPersons.length < (appConfig.autoGrouping.minGroupSize || 2)) {
            break;
        }
        
        // Determine the maximum allowed group size based on existing groups
        let maxAllowedGroupSize = targetGroupSize;
        if (groupSizes.length > 0) {
            const maxExistingGroupSize = Math.max(...groupSizes);
            const minExistingGroupSize = Math.min(...groupSizes);
            
            // Adjust max allowed group size to maintain balance
            maxAllowedGroupSize = Math.min(
                targetGroupSize,
                maxExistingGroupSize + maxSizeDifference
            );
        }
        
        // Find available unassigned leaders
        const availableLeaders = unassignedPersons.filter(p => p.leader);
        
        // Skip if no available leaders
        if (availableLeaders.length === 0) {
            break;
        }
        
        // Find travel times for available leaders to this meeting point
        const leaderTravelTimes = availableLeaders.map(leader => {
            const leaderData = travelData.personTravelTimes.find(
                data => data.person.id === leader.id
            );
            
            const travelToMeeting = leaderData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                leader: leader,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity,
                distance: travelToMeeting ? travelToMeeting.distanceInKm : Infinity
            };
        });
        
        // Sort leaders by travel time (closest first)
        leaderTravelTimes.sort((a, b) => a.travelTime - b.travelTime);
        
        // Select the closest leader
        const selectedLeader = leaderTravelTimes[0].leader;
        
        // Find available unassigned helpers (excluding the leader)
        const availableHelpers = unassignedPersons.filter(p => 
            p.helper && p.id !== selectedLeader.id
        );
        
        // Skip if no available helpers
        if (availableHelpers.length === 0) {
            break;
        }
        
        // Find travel times for helpers to this meeting point
        const helperTravelTimes = availableHelpers.map(helper => {
            const helperData = travelData.personTravelTimes.find(
                data => data.person.id === helper.id
            );
            
            const travelToMeeting = helperData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                helper: helper,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity,
                distance: travelToMeeting ? travelToMeeting.distanceInKm : Infinity
            };
        });
        
        // Sort helpers by travel time (closest first)
        helperTravelTimes.sort((a, b) => a.travelTime - b.travelTime);
        
        // Select the closest helper
        const selectedHelper = helperTravelTimes[0].helper;
        
        // Prepare group creation step
        const groupStep = {
            meetingPoint: meetingPoint,
            leader: {
                person: selectedLeader,
                travelTime: leaderTravelTimes[0].travelTime,
                distance: leaderTravelTimes[0].distance
            },
            helper: {
                person: selectedHelper,
                travelTime: helperTravelTimes[0].travelTime,
                distance: helperTravelTimes[0].distance
            },
            potentialMembers: []
        };
        
        // Mark leader and helper as assigned
        assignedPersonIds.add(selectedLeader.id);
        assignedPersonIds.add(selectedHelper.id);
        
        // Find and add a pioneer (not elder, servant, leader, or helper)
        const availablePioneers = unassignedPersons.filter(p => 
            p.pioneer && 
            !p.elder && 
            !p.servant && 
            !p.leader && 
            !p.helper
        );
        
        // Find pioneers closest to the meeting point
        const pioneerTravelTimes = availablePioneers.map(pioneer => {
            const pioneerData = travelData.personTravelTimes.find(
                data => data.person.id === pioneer.id
            );
            
            const travelToMeeting = pioneerData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                pioneer: pioneer,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity,
                distance: travelToMeeting ? travelToMeeting.distanceInKm : Infinity
            };
        }).sort((a, b) => a.travelTime - b.travelTime);
        
        // Add closest pioneer if available
        let selectedPioneer = null;
        if (pioneerTravelTimes.length > 0) {
            selectedPioneer = pioneerTravelTimes[0].pioneer;
            groupStep.pioneer = {
                person: selectedPioneer,
                travelTime: pioneerTravelTimes[0].travelTime,
                distance: pioneerTravelTimes[0].distance
            };
            
            // Mark pioneer as assigned
            assignedPersonIds.add(selectedPioneer.id);
        }
        
        // Find remaining unassigned persons close to the meeting point
        const remainingUnassignedPersons = unassignedPersons.filter(p => 
            p.id !== selectedLeader.id &&
            p.id !== selectedHelper.id &&
            (!selectedPioneer || p.id !== selectedPioneer.id)
        );
        
        // Find remaining persons' travel times to the meeting point
        const remainingPersonTravelTimes = remainingUnassignedPersons.map(person => {
            const personData = travelData.personTravelTimes.find(
                data => data.person.id === person.id
            );
            
            const travelToMeeting = personData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            return {
                person: person,
                travelTime: travelToMeeting ? travelToMeeting.drivingMinutes : Infinity,
                distance: travelToMeeting ? travelToMeeting.distanceInKm : Infinity
            };
        }).sort((a, b) => a.travelTime - b.travelTime);
        
        // Calculate how many additional members we can add
        const remainingGroupSlots = maxAllowedGroupSize - (selectedPioneer ? 3 : 2);
        
        // Prepare potential members
        const potentialMembers = remainingPersonTravelTimes
            .slice(0, remainingGroupSlots)
            .map(memberTime => ({
                person: memberTime.person,
                travelTime: memberTime.travelTime,
                distance: memberTime.distance
            }));
        
        groupStep.potentialMembers = potentialMembers;
        
        // Mark potential members as assigned
        potentialMembers.forEach(member => {
            assignedPersonIds.add(member.person.id);
        });
        
        // Calculate and track current group size
        const currentGroupSize = 1 + 1 + (selectedPioneer ? 1 : 0) + potentialMembers.length;
        groupSizes.push(currentGroupSize);
        
        // Add to group creation steps
        groupCreationSteps.push(groupStep);
    }
    
    return groupCreationSteps;
}

// Display group creation preview
function displayGroupCreationPreview(groupCreationSteps) {
    const container = document.getElementById('group-creation-steps-container');
    container.innerHTML = ''; // Clear previous content
    
    // Create preview for each group
    groupCreationSteps.forEach((groupStep, index) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-creation-step';
        
        // Create detailed group description
        groupElement.innerHTML = `
            <h4>Group ${index + 1} - Near ${groupStep.meetingPoint.name}</h4>
            
            <div class="group-step-details">
                <div class="leader-section">
                    <h5>Leader</h5>
                    <p>${groupStep.leader.person.name}</p>
                    <p>Travel Time: ${groupStep.leader.travelTime} mins</p>
                    <p>Distance: ${groupStep.leader.distance.toFixed(1)} km</p>
                </div>
                
                <div class="helper-section">
                    <h5>Helper</h5>
                    <p>${groupStep.helper.person.name}</p>
                    <p>Travel Time: ${groupStep.helper.travelTime} mins</p>
                    <p>Distance: ${groupStep.helper.distance.toFixed(1)} km</p>
                </div>
                
                ${groupStep.pioneer ? `
                <div class="pioneer-section">
                    <h5>Pioneer</h5>
                    <p>${groupStep.pioneer.person.name}</p>
                    <p>Travel Time: ${groupStep.pioneer.travelTime} mins</p>
                    <p>Distance: ${groupStep.pioneer.distance.toFixed(1)} km</p>
                </div>
                ` : ''}
                
                <div class="potential-members-section">
                    <h5>Potential Members (${groupStep.potentialMembers.length})</h5>
                    ${groupStep.potentialMembers.map(member => `
                        <div class="potential-member">
                            <p>${member.person.name}</p>
                            <p>Travel Time: ${member.travelTime} mins</p>
                            <p>Distance: ${member.distance.toFixed(1)} km</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.appendChild(groupElement);
    });
    
    // Show the modal
    document.getElementById('group-creation-preview-modal').style.display = 'flex';
}

// Initialize group creation preview functionality
function initGroupCreationPreview() {
    // Set up confirm button handler
    document.getElementById('confirm-group-creation').addEventListener('click', () => {
        // Show loading indicator
        showGroupingLoadingIndicator();
        
        // Perform actual group creation
        calculateAllTravelTimes().then(travelData => {
            const newGroups = createGroupsFromTravelData(travelData);
            
            // Apply the new groups - THIS WAS MISSING
            applyNewGroups(newGroups);
            
            // Close the preview modal
            document.getElementById('group-creation-preview-modal').style.display = 'none';
            
            // Hide loading indicator
            hideGroupingLoadingIndicator();
        }).catch(error => {
            console.error('Error creating groups:', error);
            alert('Error creating groups. Please try again.');
            hideGroupingLoadingIndicator();
        });
    });
    
    // Set up cancel button handler
    document.getElementById('cancel-group-creation').addEventListener('click', () => {
        document.getElementById('group-creation-preview-modal').style.display = 'none';
    });
    
    // Set up close button handler
    document.getElementById('close-group-creation-preview').addEventListener('click', () => {
        document.getElementById('group-creation-preview-modal').style.display = 'none';
    });
}

// Initialize the new grouping functionality
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize preview functionality
    initGroupCreationPreview();
    
    // Add the meeting-based grouping button
    addMeetingBasedGroupingButton();
    
    // Add CSS for the loading overlay
    const style = document.createElement('style');
    style.textContent = `
        #grouping-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .grouping-loading-container {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
});