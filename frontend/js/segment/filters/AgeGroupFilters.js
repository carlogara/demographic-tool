/**
 * File: AgeGroupFilters.js
 * Location: demographic-tool/frontend/js/segment/filters/AgeGroupFilters.js
 * Purpose:
 *   - Handles age group filter components
 *   - Manages age group buttons for both nationality and education datasets
 *   - FIXED: Improved button generation to prevent duplication
 */

/**
 * Initialize age group buttons
 */
function initAgeGroupButtons() {
  // For nationality dataset - clear existing buttons first
  $("#age-group-buttons").html('<button class="age-group-btn all-btn active" data-value="all">All Ages</button>');
  populateAgeGroupButtons("#age-group-buttons", getAgeGroups());
  
  // For education dataset - clear existing buttons first
  $("#edu-age-group-buttons").html('<button class="age-group-btn all-btn active" data-value="all">All Ages</button>');
  populateAgeGroupButtons("#edu-age-group-buttons", getEduAgeGroups());
  
  // Remove any existing event handlers to prevent duplicates
  $(".age-group-buttons").off("click", ".age-group-btn");
  
  // Age group button click handler (both datasets)
  $(".age-group-buttons").on("click", ".age-group-btn", function() {
    const ageButtons = $(this).closest(".age-group-buttons");
    const isEduButtons = ageButtons.attr("id") === "edu-age-group-buttons";
    const stateKey = isEduButtons ? "eduAgeGroup" : "ageGroup";
    const statusElement = isEduButtons ? "#edu-age-filter-status" : "#age-filter-status";
    
    const isAllBtn = $(this).hasClass("all-btn");
    const wasActive = $(this).hasClass("active");
    
    if (isAllBtn) {
      // Clicking "All Ages" should activate it and deactivate others
      if (!wasActive) {
        ageButtons.find(".age-group-btn").removeClass("active");
        $(this).addClass("active");
        
        // Update state
        window.filterState[stateKey].allSelected = true;
        window.filterState[stateKey].selectedAgeGroups = [];
        
        // Update status
        $(statusElement).text("All Ages");
      }
      // If "All" is already active, do nothing
    } else {
      // Clicked on specific age group
      if (wasActive) {
        // Count currently active specific age buttons
        const activeCount = ageButtons.find(".age-group-btn.active").not(".all-btn").length;
        
        // Don't allow deactivating the last specific button directly
        // Instead, just activate "All" and deactivate this one
        if (activeCount <= 1) {
          // Activate "All" button
          ageButtons.find(".all-btn").addClass("active");
          
          // Deactivate this button
          $(this).removeClass("active");
          
          // Update state
          window.filterState[stateKey].allSelected = true;
          window.filterState[stateKey].selectedAgeGroups = [];
          
          // Update status
          $(statusElement).text("All Ages");
        } else {
          // Normal case - just remove this age group
          $(this).removeClass("active");
          const value = $(this).data("value");
          
          // Update the selected age groups
          window.filterState[stateKey].selectedAgeGroups = window.filterState[stateKey].selectedAgeGroups.filter(
            age => age !== value
          );
          
          // Update status
          updateAgeFilterStatus(isEduButtons);
        }
      } else {
        // Activating a specific age group - deactivate "All" if it's active
        if (ageButtons.find(".all-btn").hasClass("active")) {
          ageButtons.find(".all-btn").removeClass("active");
          window.filterState[stateKey].allSelected = false;
        }
        
        // Activate this age group
        $(this).addClass("active");
        
        // Add to selected age groups
        window.filterState[stateKey].selectedAgeGroups.push($(this).data("value"));
        
        // Update status
        updateAgeFilterStatus(isEduButtons);
      }
    }
  });
}

/**
 * Populate age group buttons based on available age groups
 * @param {string} containerId - Selector for the button container
 * @param {Array} ageGroups - Array of age group strings
 */
function populateAgeGroupButtons(containerId, ageGroups) {
  // Check if we have valid age groups
  if (!ageGroups || !Array.isArray(ageGroups) || ageGroups.length === 0) {
    console.warn("No age groups available for population");
    return;
  }
  
  const container = $(containerId);
  
  // IMPORTANT: Don't add "All" button here as it's already added in the calling function
  
  // Add buttons for age groups
  ageGroups.forEach(age => {
    container.append(`<button class="age-group-btn" data-value="${age}">${age}</button>`);
  });
}

/**
 * Update the filter status text for age groups
 * @param {boolean} isEdu - Whether this is for education filters
 */
function updateAgeFilterStatus(isEdu) {
  const stateKey = isEdu ? "eduAgeGroup" : "ageGroup";
  const statusElement = isEdu ? "#edu-age-filter-status" : "#age-filter-status";
  
  const count = window.filterState[stateKey].selectedAgeGroups.length;
  
  if (count === 0) {
    $(statusElement).text("All Ages");
  } else if (count === 1) {
    $(statusElement).text(`Age: ${window.filterState[stateKey].selectedAgeGroups[0]}`);
  } else {
    $(statusElement).text(`${count} age groups selected`);
  }
}

/**
 * Get all available age groups from the dataset
 * @returns {Array} Array of age group strings
 */
function getAgeGroups() {
  // Safely check if locationData is available
  if (!window.locationData || !Array.isArray(window.locationData) || window.locationData.length === 0) {
    console.warn("locationData not available for age groups");
    return [];
  }
  
  // Get all unique age groups from the dataset
  const ageGroups = [...new Set(window.locationData
    .filter(row => row["Age Group"] && row["Age Group"] !== "Total")
    .map(row => row["Age Group"]))];
  
  // Sort age groups
  ageGroups.sort((a, b) => {
    // Extract first number from age group (e.g., "0-4" -> 0)
    const aMatch = a.match(/\d+/);
    const bMatch = b.match(/\d+/);
    
    if (!aMatch || !bMatch) return 0;
    
    const aNum = parseInt(aMatch[0]);
    const bNum = parseInt(bMatch[0]);
    return aNum - bNum;
  });
  
  return ageGroups;
}

/**
 * Get all available age groups for education data
 * @returns {Array} Array of age group strings
 */
function getEduAgeGroups() {
  // Safely check if studiesDataset is available
  if (!window.studiesDataset || !Array.isArray(window.studiesDataset) || window.studiesDataset.length === 0) {
    console.warn("studiesDataset not available for education age groups");
    return ["0-14", "15-19", "20-24", "25-64", "65-74", "75+"];
  }
  
  // Get all unique age groups from the education dataset
  const eduAgeGroups = [...new Set(window.studiesDataset
    .filter(row => row["Age Group"] && row["Age Group"] !== "Total")
    .map(row => row["Age Group"]))];
  
  // Sort age groups
  eduAgeGroups.sort((a, b) => {
    // Extract first number from age group (e.g., "0-4" -> 0)
    const aMatch = a.match(/\d+/);
    const bMatch = b.match(/\d+/);
    
    if (!aMatch || !bMatch) return 0;
    
    const aNum = parseInt(aMatch[0]);
    const bNum = parseInt(bMatch[0]);
    return aNum - bNum;
  });
  
  // Return the sorted groups or a fallback if empty
  return eduAgeGroups.length > 0 ? eduAgeGroups : ["0-14", "15-19", "20-24", "25-64", "65-74", "75+"];
}

/**
 * Update age group filters based on data changes
 */
function updateAgeGroupFiltersFromData() {
  // Clear and repopulate age group buttons
  $("#age-group-buttons").html('<button class="age-group-btn all-btn active" data-value="all">All Ages</button>');
  populateAgeGroupButtons("#age-group-buttons", getAgeGroups());
  
  $("#edu-age-group-buttons").html('<button class="age-group-btn all-btn active" data-value="all">All Ages</button>');
  populateAgeGroupButtons("#edu-age-group-buttons", getEduAgeGroups());
  
  // Reset filter status text
  $("#age-filter-status").text("All Ages");
  $("#edu-age-filter-status").text("All Ages");
}

// Export module functions
window.AgeGroupFilters = {
  init: initAgeGroupButtons,
  updateFromData: updateAgeGroupFiltersFromData,
  updateStatus: updateAgeFilterStatus,
  getAgeGroups: getAgeGroups,
  getEduAgeGroups: getEduAgeGroups
};