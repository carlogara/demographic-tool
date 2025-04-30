/**
 * File: GenderFilters.js
 * Location: demographic-tool/frontend/js/segment/filters/GenderFilters.js
 * Purpose:
 *   - Handles gender toggle filter components
 *   - Manages gender selection for both nationality and education datasets
 */

/**
 * Initialize gender toggle buttons
 */
function initGenderToggles() {
  // Remove any existing event handlers to prevent duplicates
  $(".gender-toggle").off("click", ".gender-toggle-btn");
  
  // Gender toggle handler (both datasets)
  $(".gender-toggle").on("click", ".gender-toggle-btn", function() {
    const genderToggle = $(this).closest(".gender-toggle");
    const isEduToggle = genderToggle.closest("#education-intuitive-filters").length > 0;
    const stateKey = isEduToggle ? "eduGender" : "gender";
    const statusElement = isEduToggle ? "#edu-gender-filter-status" : "#gender-filter-status";
    
    const value = $(this).data("value");
    const isAllBtn = value === "all";
    const wasActive = $(this).hasClass("active");
    
    // Can't deactivate a button directly
    if (wasActive) return;
    
    // Remove active class from all buttons
    genderToggle.find(".gender-toggle-btn").removeClass("active");
    
    // Activate this button
    $(this).addClass("active");
    
    // Update state
    if (isAllBtn) {
      window.filterState[stateKey].allSelected = true;
      window.filterState[stateKey].selectedGenders = [];
      $(statusElement).text("All Genders");
    } else {
      window.filterState[stateKey].allSelected = false;
      window.filterState[stateKey].selectedGenders = [value];
      $(statusElement).text(value === "H" ? "Male" : "Female");
    }
  });
}

/**
 * Update gender filters from data
 */
function updateGenderFiltersFromData() {
  // Reset the UI elements
  $(".gender-toggle-btn").removeClass("active");
  $(".gender-toggle-btn[data-value='all']").addClass("active");
  
  // Reset status text
  $("#gender-filter-status").text("All Genders");
  $("#edu-gender-filter-status").text("All Genders");
}

// Export module functions
window.GenderFilters = {
  init: initGenderToggles,
  updateFromData: updateGenderFiltersFromData
};