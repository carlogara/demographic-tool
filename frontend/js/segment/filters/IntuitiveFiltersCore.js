/**
 * File: IntuitiveFiltersCore.js
 * Location: demographic-tool/frontend/js/segment/filters/IntuitiveFiltersCore.js
 * Purpose:
 *   - Main entry point for intuitive filters functionality
 *   - Manages initialization and coordination between filter modules
 *   - Provides the public API for other modules to use
 *   - FIXED: Better initialization tracking to solve the back-to-home search issue
 */

// Global state to track selected filters - shared across all filter modules
window.filterState = {
  nationality: {
    allSelected: true,
    selectedNationalities: []
  },
  ageGroup: {
    allSelected: true,
    selectedAgeGroups: []
  },
  gender: {
    allSelected: true,
    selectedGenders: []
  },
  education: {
    allSelected: true,
    selectedLevels: []
  },
  eduAgeGroup: {
    allSelected: true,
    selectedAgeGroups: []
  },
  eduGender: {
    allSelected: true,
    selectedGenders: []
  }
};

// Improved initialization tracking with lock mechanism
let filtersInitialized = false;
let initializationInProgress = false;
let pendingInitTimer = null;

/**
 * Initialize the intuitive filters
 * Note: This should only be called after locationData is available
 * FIXED: Added better initialization tracking to prevent duplicate initialization
 */
function initIntuitiveFilters() {
  // Check if locationData is available
  if (!window.locationData || window.locationData.length === 0) {
    console.warn("Intuitive filters initialization deferred - locationData not available");
    
    // Set up a retry if locationData isn't available yet
    if (!pendingInitTimer) {
      pendingInitTimer = setTimeout(() => {
        pendingInitTimer = null;
        if (window.locationData && window.locationData.length > 0) {
          console.log("Retrying initialization after data loaded");
          initIntuitiveFilters();
        }
      }, 500);
    }
    return;
  }

  // Prevent concurrent initialization
  if (initializationInProgress) {
    console.log("Initialization already in progress, skipping");
    return;
  }

  // If already initialized, just update the data instead of creating new event handlers
  if (filtersInitialized) {
    console.log("Filters already initialized - just updating data");
    updateIntuitiveFiltersFromData();
    return;
  }

  console.log("Initializing intuitive filters for the first time");
  initializationInProgress = true;

  try {
    // Initialize all filter components
    window.NationalityFilters.init();
    window.AgeGroupFilters.init();
    window.GenderFilters.init();
    window.EducationFilters.init();
    
    // Initialize apply buttons
    initApplyButtons();
    
    // Dataset toggle buttons
    initDatasetToggles();
    
    // Mark as initialized to prevent duplicate event handlers
    filtersInitialized = true;
    console.log("Intuitive filters initialization complete");
  } catch (error) {
    console.error("Error during filters initialization:", error);
  } finally {
    initializationInProgress = false;
  }
}

/**
 * Force reinitialization of filters
 * Call this when returning to landing page and then searching again
 */
function resetIntuitive() {
  console.log("Forcing filters reinitialization");
  filtersInitialized = false;
  initializationInProgress = false;
  if (pendingInitTimer) {
    clearTimeout(pendingInitTimer);
    pendingInitTimer = null;
  }
}

/**
 * Initialize dataset toggle buttons
 */
function initDatasetToggles() {
  // Remove any existing event handlers to prevent duplicates
  $("#nationality-dataset-btn").off("click");
  $("#education-dataset-btn").off("click");
  
  $("#nationality-dataset-btn").on("click", function() {
    $(".dataset-btn").removeClass("active");
    $(this).addClass("active");
    $("#nationality-intuitive-filters").show();
    $("#education-intuitive-filters").hide();
    
    // Ensure traditional dropdowns stay hidden
    $("#nationality-filters, #education-filters").hide();
  });

  $("#education-dataset-btn").on("click", function() {
    $(".dataset-btn").removeClass("active");
    $(this).addClass("active");
    $("#nationality-intuitive-filters").hide();
    $("#education-intuitive-filters").show();
    
    // Ensure traditional dropdowns stay hidden
    $("#nationality-filters, #education-filters").hide();
  });
}

/**
 * Initialize apply filter buttons
 */
function initApplyButtons() {
  // Remove any existing event handlers to prevent duplicates
  $("#apply-intuitive-filters").off("click");
  $("#apply-intuitive-edu-filters").off("click");
  
  // Nationality filters apply button
  $("#apply-intuitive-filters").on("click", function() {
    // Convert filter state to values for the chart
    applyFiltersToChart(false);
  });
  
  // Education filters apply button
  $("#apply-intuitive-edu-filters").on("click", function() {
    // Convert filter state to values for the chart
    applyFiltersToChart(true);
  });
}

/**
 * Apply the current filter state to update the chart
 * @param {boolean} isEducation - Whether to apply education filters
 */
function applyFiltersToChart(isEducation) {
  // Ensure traditional dropdowns stay hidden
  $("#nationality-filters, #education-filters").hide();
  
  if (isEducation) {
    // Get selected education levels
    let educationLevels = [];
    if (window.filterState.education.allSelected) {
      educationLevels = ['all'];
    } else {
      educationLevels = window.filterState.education.selectedLevels;
      if (educationLevels.length === 0) {
        educationLevels = ['all'];
      }
    }
    
    // Get selected age groups
    let ageGroups = [];
    if (window.filterState.eduAgeGroup.allSelected) {
      ageGroups = ['all'];
    } else {
      ageGroups = window.filterState.eduAgeGroup.selectedAgeGroups;
      if (ageGroups.length === 0) {
        ageGroups = ['all'];
      }
    }
    
    // Get selected genders
    let genders = [];
    if (window.filterState.eduGender.allSelected) {
      genders = ['all'];
    } else {
      genders = window.filterState.eduGender.selectedGenders;
      if (genders.length === 0) {
        genders = ['all'];
      }
    }
    
    // Silently set values in the hidden select elements for compatibility
    $("#education-level-select").val(educationLevels);
    $("#edu-age-group-select").val(ageGroups);
    $("#edu-gender-select").val(genders);
    
    // Update segment name
    window.segmentFiltersModule.updateSegmentName();
    
    // After a short delay, update chart and ensure dropdowns are still hidden
    setTimeout(() => {
      // Ensure traditional dropdowns stay hidden
      $("#nationality-filters, #education-filters").hide();
      
      // Update chart
      updateSegmentChart($("input[name='display-mode']:checked").val());
    }, 50);
  } else {
    // Get selected nationalities
    let nationalities = [];
    if (window.filterState.nationality.allSelected) {
      nationalities = ['all'];
    } else {
      nationalities = window.filterState.nationality.selectedNationalities;
      if (nationalities.length === 0) {
        nationalities = ['all'];
      }
    }
    
    // Get selected age groups
    let ageGroups = [];
    if (window.filterState.ageGroup.allSelected) {
      ageGroups = ['all'];
    } else {
      ageGroups = window.filterState.ageGroup.selectedAgeGroups;
      if (ageGroups.length === 0) {
        ageGroups = ['all'];
      }
    }
    
    // Get selected genders
    let genders = [];
    if (window.filterState.gender.allSelected) {
      genders = ['all'];
    } else {
      genders = window.filterState.gender.selectedGenders;
      if (genders.length === 0) {
        genders = ['all'];
      }
    }
    
    // Silently set values in the hidden select elements for compatibility
    $("#nationality-select").val(nationalities);
    $("#age-group-select").val(ageGroups);
    $("#gender-select").val(genders);
    
    // Update segment name
    window.segmentFiltersModule.updateSegmentName();
    
    // After a short delay, update chart and ensure dropdowns are still hidden
    setTimeout(() => {
      // Ensure traditional dropdowns stay hidden
      $("#nationality-filters, #education-filters").hide();
      
      // Update chart
      updateSegmentChart($("input[name='display-mode']:checked").val());
    }, 50);
  }
  
  // Show intuitive filters based on which dataset is active
  if ($("#education-dataset-btn").hasClass("active")) {
    $("#nationality-intuitive-filters").hide();
    $("#education-intuitive-filters").show();
  } else {
    $("#nationality-intuitive-filters").show();
    $("#education-intuitive-filters").hide();
  }
}

/**
 * Update the intuitive filters state based on initial data
 * Called after switching locations or datasets
 */
function updateIntuitiveFiltersFromData() {
  // Don't try to update if locationData isn't available yet
  if (!window.locationData || window.locationData.length === 0) {
    console.warn("updateIntuitiveFiltersFromData called but locationData not available");
    return;
  }
  
  // Reset filter state
  resetFilterState();
  
  // Update components
  window.NationalityFilters.updateFromData();
  window.AgeGroupFilters.updateFromData();
  window.GenderFilters.updateFromData();
  window.EducationFilters.updateFromData();
  
  // Ensure traditional dropdowns stay hidden
  $("#nationality-filters, #education-filters").hide();
}

/**
 * Reset the filter state to defaults
 */
function resetFilterState() {
  window.filterState.nationality.allSelected = true;
  window.filterState.nationality.selectedNationalities = [];
  
  window.filterState.ageGroup.allSelected = true;
  window.filterState.ageGroup.selectedAgeGroups = [];
  
  window.filterState.gender.allSelected = true;
  window.filterState.gender.selectedGenders = [];
  
  window.filterState.education.allSelected = true;
  window.filterState.education.selectedLevels = [];
  
  window.filterState.eduAgeGroup.allSelected = true;
  window.filterState.eduAgeGroup.selectedAgeGroups = [];
  
  window.filterState.eduGender.allSelected = true;
  window.filterState.eduGender.selectedGenders = [];
}

/**
 * Save the current filter state for location persistence
 */
function saveIntuitiveFilterState() {
  // Store the current filter state in session storage
  sessionStorage.setItem('intuitiveFilterState', JSON.stringify(window.filterState));
}

/**
 * Restore the filter state from saved state
 */
function restoreIntuitiveFilterState() {
  const savedState = sessionStorage.getItem('intuitiveFilterState');
  
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      
      // Merge with current state, only taking valid properties
      if (parsedState.nationality) {
        window.filterState.nationality = parsedState.nationality;
      }
      
      if (parsedState.ageGroup) {
        window.filterState.ageGroup = parsedState.ageGroup;
      }
      
      if (parsedState.gender) {
        window.filterState.gender = parsedState.gender;
      }
      
      if (parsedState.education) {
        window.filterState.education = parsedState.education;
      }
      
      if (parsedState.eduAgeGroup) {
        window.filterState.eduAgeGroup = parsedState.eduAgeGroup;
      }
      
      if (parsedState.eduGender) {
        window.filterState.eduGender = parsedState.eduGender;
      }
      
      // Update UI to match the restored state
      window.StateManager.updateUIFromState();
    } catch (e) {
      console.warn('Error restoring filter state:', e);
      resetFilterState();
    }
  }
}

// Export globally for use by other modules
window.IntuitiveFiltersCore = {
  init: initIntuitiveFilters,
  reset: resetIntuitive,
  updateFromData: updateIntuitiveFiltersFromData,
  saveState: saveIntuitiveFilterState,
  restoreState: restoreIntuitiveFilterState,
  applyFilters: applyFiltersToChart,
  resetFilterState: resetFilterState
};

// For backward compatibility with existing code
window.intuitiveFiltersModule = window.IntuitiveFiltersCore;

// Setup hook to fix the back-to-landing initialization issue
$(document).ready(function() {
  // Hook into the back-to-landing button to reset the module
  $('#back-to-landing').on('click', function() {
    resetIntuitive();
  });
});