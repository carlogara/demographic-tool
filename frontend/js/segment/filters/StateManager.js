/**
 * File: StateManager.js
 * Location: demographic-tool/frontend/js/segment/filters/StateManager.js
 * Purpose:
 *   - Manages the UI state of all filter components
 *   - Coordinates UI updates based on state changes
 *   - Handles serialization and restoration of filter states
 */

/**
 * Update UI elements based on current filter state
 */
function updateUIFromState() {
  // Don't try to update UI if locationData isn't available yet
  if (!window.locationData || window.locationData.length === 0) {
    console.warn("updateUIFromState called but locationData not available");
    return;
  }
  
  // Nationality section
  if (window.filterState.nationality.allSelected) {
    $("#all-nationalities-btn").addClass("active");
    $("#nationality-tags").empty();
    $("#nationality-filter-status").text("All Nationalities");
  } else {
    $("#all-nationalities-btn").removeClass("active");
    
    // Rebuild nationality tags
    $("#nationality-tags").empty();
    const allNationalities = window.NationalityFilters.getAllNationalities();
    
    window.filterState.nationality.selectedNationalities.forEach(value => {
      const nationalityInfo = allNationalities.find(nat => nat.value === value);
      
      if (nationalityInfo) {
        const tagHTML = `
          <div class="nationality-tag" data-value="${value}">
            ${nationalityInfo.name}
            <span class="remove-tag"><i class="fas fa-times"></i></span>
          </div>
        `;
        
        $("#nationality-tags").append(tagHTML);
      }
    });
    
    window.NationalityFilters.updateStatus();
  }
  
  // Age group section
  if (window.filterState.ageGroup.allSelected) {
    $("#age-group-buttons .age-group-btn").removeClass("active");
    $("#age-group-buttons .all-btn").addClass("active");
    $("#age-filter-status").text("All Ages");
  } else {
    $("#age-group-buttons .age-group-btn").removeClass("active");
    
    window.filterState.ageGroup.selectedAgeGroups.forEach(value => {
      $(`#age-group-buttons .age-group-btn[data-value="${value}"]`).addClass("active");
    });
    
    window.AgeGroupFilters.updateStatus(false);
  }
  
  // Education age group section
  if (window.filterState.eduAgeGroup.allSelected) {
    $("#edu-age-group-buttons .age-group-btn").removeClass("active");
    $("#edu-age-group-buttons .all-btn").addClass("active");
    $("#edu-age-filter-status").text("All Ages");
  } else {
    $("#edu-age-group-buttons .age-group-btn").removeClass("active");
    
    window.filterState.eduAgeGroup.selectedAgeGroups.forEach(value => {
      $(`#edu-age-group-buttons .age-group-btn[data-value="${value}"]`).addClass("active");
    });
    
    window.AgeGroupFilters.updateStatus(true);
  }
  
  // Gender toggles
  if (window.filterState.gender.allSelected) {
    $("#nationality-intuitive-filters .gender-toggle-btn").removeClass("active");
    $("#nationality-intuitive-filters .gender-toggle-btn[data-value='all']").addClass("active");
    $("#gender-filter-status").text("All Genders");
  } else if (window.filterState.gender.selectedGenders.length > 0) {
    $("#nationality-intuitive-filters .gender-toggle-btn").removeClass("active");
    const gender = window.filterState.gender.selectedGenders[0];
    $(`#nationality-intuitive-filters .gender-toggle-btn[data-value='${gender}']`).addClass("active");
    $("#gender-filter-status").text(gender === "H" ? "Male" : "Female");
  }
  
  if (window.filterState.eduGender.allSelected) {
    $("#education-intuitive-filters .gender-toggle-btn").removeClass("active");
    $("#education-intuitive-filters .gender-toggle-btn[data-value='all']").addClass("active");
    $("#edu-gender-filter-status").text("All Genders");
  } else if (window.filterState.eduGender.selectedGenders.length > 0) {
    $("#education-intuitive-filters .gender-toggle-btn").removeClass("active");
    const gender = window.filterState.eduGender.selectedGenders[0];
    $(`#education-intuitive-filters .gender-toggle-btn[data-value='${gender}']`).addClass("active");
    $("#edu-gender-filter-status").text(gender === "H" ? "Male" : "Female");
  }
  
  // Education levels
  if (window.filterState.education.allSelected) {
    $("#education-level-buttons .age-group-btn").removeClass("active");
    $("#education-level-buttons .all-btn").addClass("active");
    $("#education-level-filter-status").text("All Education Levels");
  } else {
    $("#education-level-buttons .age-group-btn").removeClass("active");
    
    window.filterState.education.selectedLevels.forEach(value => {
      $(`#education-level-buttons .age-group-btn[data-value="${value}"]`).addClass("active");
    });
    
    window.EducationFilters.updateStatus();
  }
}

// Export module functions
window.StateManager = {
  updateUIFromState: updateUIFromState
};