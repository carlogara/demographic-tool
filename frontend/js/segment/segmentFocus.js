/**
 * File: segmentFocus.js
 * Location: demographic-tool/frontend/js/segment/segmentFocus.js
 * Purpose:
 *   - Main entry point for the segment analysis functionality
 *   - Integrates the various segment-related modules
 *   - Handles initialization and data population
 *   - UPDATED: Fixes display order and other UI issues
 */

/**
 * Initialize the segment focus section
 * Called from main.js after datasets are loaded
 */
function initSegmentFocus() {
  // Initialize the traditional filter interface (now hidden by default)
  window.segmentFiltersModule.init();
  
  // Initialize the comparison context
  window.segmentContextModule.init();
  
  // Initialize the chart
  window.segmentChartModule.init();
  
  // Set up a global event listener for Select2 dropdowns to trigger summaries
  $(document).on('select2:close', '.filter-select', function() {
    // Update the filter summary when a dropdown is closed
    updateFilterSummary();
  });
  
  // Function to update filter summaries (delegates to segmentChart module)
  function updateFilterSummary() {
    if (typeof window.segmentChartModule.updateFilterSummary === 'function') {
      window.segmentChartModule.updateFilterSummary();
    }
  }
  
  // Immediately hide the original filters and show intuitive filters
  // Set this first, before any other initialization
  $("#nationality-filters, #education-filters").hide();
  $("#nationality-intuitive-filters").show();
  $("#education-intuitive-filters").hide();
  
  // Note: We don't initialize intuitive filters here since it requires locationData
  // Instead, it will be initialized in populateSegmentData when data is available
  
  // Set up a toggle to switch between traditional and intuitive filters (for debugging)
  // You can remove this in production if you don't need it
  /*
  $('<button id="toggle-filter-mode" style="position:fixed;bottom:10px;right:10px;z-index:1000;">Toggle Filter Mode</button>')
    .appendTo('body')
    .on('click', function() {
      if ($("#nationality-filters").is(":visible")) {
        $("#nationality-filters, #education-filters").hide();
        $("#nationality-intuitive-filters, #education-intuitive-filters").show();
        if ($("#education-dataset-btn").hasClass("active")) {
          $("#nationality-intuitive-filters").hide();
        } else {
          $("#education-intuitive-filters").hide();
        }
      } else {
        $("#nationality-intuitive-filters, #education-intuitive-filters").hide();
        if ($("#education-dataset-btn").hasClass("active")) {
          $("#education-filters").show();
        } else {
          $("#nationality-filters").show();
        }
      }
    });
  */
}

/**
 * Populates data for segment analysis based on the selected location's parent
 * Called from dataHandler.js after updateData()
 */
function populateSegmentData() {
  // Immediately show intuitive filters and hide traditional ones
  $("#nationality-filters, #education-filters").hide();
  $("#nationality-intuitive-filters").show();
  $("#education-intuitive-filters").hide();
  
  // Populate the traditional filters first (to prepare data structures)
  window.segmentFiltersModule.populateNationalityDropdown();
  window.segmentFiltersModule.populateAgeGroupDropdowns();
  window.segmentFiltersModule.updateSegmentName();
  
  // Now locationData is available, initialize intuitive filters
  if (window.intuitiveFiltersModule) {
    // First initialize if not already done
    window.intuitiveFiltersModule.init();
    
    // Then update based on current data
    window.intuitiveFiltersModule.updateFromData();
  }
  
  // Always hide the results container until filters are applied
  $(".results-container").hide();
  
  // Update comparison context buttons based on location type
  window.segmentContextModule.updateComparisonContextButtons();
  
  const selectedLocation = $("#current-location-name").text();
  const locationType = getLocationType(selectedLocation);
  
  // Show region view toggle only for regions
  $("#region-view-toggle").toggle(locationType === "region");
}

/**
 * Handles state restoration when navigating back to segment view
 * This ensures that when users switch between views, their previous selections are maintained
 */
function restoreSegmentState() {
  // Ensure intuitive filters are shown
  $("#nationality-filters, #education-filters").hide();
  
  if ($("#education-dataset-btn").hasClass("active")) {
    $("#nationality-intuitive-filters").hide();
    $("#education-intuitive-filters").show();
  } else {
    $("#nationality-intuitive-filters").show();
    $("#education-intuitive-filters").hide();
  }
  
  // Restore traditional filter state (for compatibility)
  const storedNationalities = sessionStorage.getItem('selectedNationalities');
  const storedAgeGroups = sessionStorage.getItem('selectedAgeGroups');
  const storedGenders = sessionStorage.getItem('selectedGenders');
  
  if (storedNationalities) {
    try {
      const nationalities = JSON.parse(storedNationalities);
      $("#nationality-select").val(nationalities).trigger('change');
    } catch (e) {
      console.warn('Error restoring nationality selections:', e);
    }
  }
  
  if (storedAgeGroups) {
    try {
      const ageGroups = JSON.parse(storedAgeGroups);
      $("#age-group-select").val(ageGroups).trigger('change');
    } catch (e) {
      console.warn('Error restoring age group selections:', e);
    }
  }
  
  if (storedGenders) {
    try {
      const genders = JSON.parse(storedGenders);
      $("#gender-select").val(genders).trigger('change');
    } catch (e) {
      console.warn('Error restoring gender selections:', e);
    }
  }
  
  // Similar restoration for education filters
  const storedEduLevels = sessionStorage.getItem('selectedEduLevels');
  const storedEduAgeGroups = sessionStorage.getItem('selectedEduAgeGroups');
  const storedEduGenders = sessionStorage.getItem('selectedEduGenders');
  
  // Apply similar restoration logic for education filters
  
  // Restore intuitive filter state only if locationData is available
  if (window.locationData && window.locationData.length > 0) {
    if (window.intuitiveFiltersModule && window.intuitiveFiltersModule.restoreState) {
      window.intuitiveFiltersModule.restoreState();
    }
  }
}

/**
 * Save the current filter state to session storage
 * Useful when navigating between views or refreshing the page
 */
function saveFilterState() {
  // Get current selections from traditional filters
  const nationalities = $("#nationality-select").val() || ['all'];
  const ageGroups = $("#age-group-select").val() || ['all'];
  const genders = $("#gender-select").val() || ['all'];
  
  // Store them in session storage
  sessionStorage.setItem('selectedNationalities', JSON.stringify(nationalities));
  sessionStorage.setItem('selectedAgeGroups', JSON.stringify(ageGroups));
  sessionStorage.setItem('selectedGenders', JSON.stringify(genders));
  
  // Do the same for education filters
  const eduLevels = $("#education-level-select").val() || ['all'];
  const eduAgeGroups = $("#edu-age-group-select").val() || ['all'];
  const eduGenders = $("#edu-gender-select").val() || ['all'];
  
  sessionStorage.setItem('selectedEduLevels', JSON.stringify(eduLevels));
  sessionStorage.setItem('selectedEduAgeGroups', JSON.stringify(eduAgeGroups));
  sessionStorage.setItem('selectedEduGenders', JSON.stringify(eduGenders));
  
  // Save intuitive filter state
  if (window.intuitiveFiltersModule && window.intuitiveFiltersModule.saveState) {
    window.intuitiveFiltersModule.saveState();
  }
}

// Export functions so they can be used by other modules
window.segmentFocusModule = {
  init: initSegmentFocus,
  populateSegmentData: populateSegmentData,
  restoreSegmentState: restoreSegmentState,
  saveFilterState: saveFilterState
};