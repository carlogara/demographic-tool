/**
 * File: EducationFilters.js
 * Location: demographic-tool/frontend/js/segment/filters/EducationFilters.js
 * Purpose:
 *   - Handles education level filter components
 *   - Manages education level selection buttons
 */

/**
 * Initialize education level buttons
 */
function initEducationFilters() {
  // Populate education level buttons first
  populateEducationLevelButtons();
  
  // Remove the event delegation handler to prevent double-triggering
  $("#education-level-buttons").off("click", ".age-group-btn");
  
  // Remove any existing direct handlers and attach new ones
  $("#education-level-buttons .age-group-btn").off("click").each(function() {
    $(this).on("click", function() {
      const levelButtons = $(this).closest("#education-level-buttons");
      const isAllBtn = $(this).hasClass("all-btn");
      const wasActive = $(this).hasClass("active");
      
      if (isAllBtn) {
        // Clicking "All Education Levels" should activate it and deactivate others
        if (!wasActive) {
          levelButtons.find(".age-group-btn").removeClass("active");
          $(this).addClass("active");
          
          // Update state
          window.filterState.education.allSelected = true;
          window.filterState.education.selectedLevels = [];
          
          // Update status
          $("#education-level-filter-status").text("All Education Levels");
        }
      } else {
        // Clicked on specific education level
        if (wasActive) {
          // Count currently active specific level buttons
          const activeCount = levelButtons.find(".age-group-btn.active").not(".all-btn").length;
          
          if (activeCount <= 1) {
            // Activate "All" button instead
            levelButtons.find(".all-btn").addClass("active");
            $(this).removeClass("active");
            
            // Update state
            window.filterState.education.allSelected = true;
            window.filterState.education.selectedLevels = [];
            
            // Update status
            $("#education-level-filter-status").text("All Education Levels");
          } else {
            // Normal case - just remove this education level
            $(this).removeClass("active");
            const value = $(this).data("value");
            
            // Update the selected education levels
            window.filterState.education.selectedLevels = window.filterState.education.selectedLevels.filter(
              level => level !== value
            );
            
            // Update status
            updateEducationFilterStatus();
          }
        } else {
          // Activating a specific education level - deactivate "All" if it's active
          if (levelButtons.find(".all-btn").hasClass("active")) {
            levelButtons.find(".all-btn").removeClass("active");
            window.filterState.education.allSelected = false;
          }
          
          // Activate this education level
          $(this).addClass("active");
          
          // Add to selected education levels - prevent duplicates
          const value = $(this).data("value");
          if (!window.filterState.education.selectedLevels.includes(value)) {
            window.filterState.education.selectedLevels.push(value);
          }
          
          // Update status
          updateEducationFilterStatus();
        }
      }
    });
  });
}

/**
 * Populate education level buttons with the available levels
 */
function populateEducationLevelButtons() {
  // Define static education levels
  const educationLevels = [
    {value: "all", label: "All Education Levels", isAllBtn: true},
    {value: "Nenhum", label: "No Education"},
    {value: "Ensino básico", label: "Basic Education"},
    {value: "Ensino secundário", label: "Secondary"},
    {value: "Ensino pós-secundário", label: "Post-Secondary"},
    {value: "Ensino superior", label: "Higher Education"}
  ];
  
  // Clear any existing buttons
  $("#education-level-buttons").empty();
  
  // Add each education level button
  educationLevels.forEach(level => {
    const btnClass = level.isAllBtn ? "age-group-btn all-btn active" : "age-group-btn";
    $("#education-level-buttons").append(
      `<button class="${btnClass}" data-value="${level.value}">${level.label}</button>`
    );
  });
}

/**
 * Update the filter status text for education levels
 */
function updateEducationFilterStatus() {
  const count = window.filterState.education.selectedLevels.length;
  
  if (count === 0) {
    $("#education-level-filter-status").text("All Education Levels");
  } else if (count === 1) {
    // Get a readable name
    const level = window.filterState.education.selectedLevels[0];
    let displayName = level;
    
    switch (level) {
      case "Nenhum":
        displayName = "No Education";
        break;
      case "Ensino básico":
        displayName = "Basic Education";
        break;
      case "Ensino secundário":
        displayName = "Secondary Education";
        break;
      case "Ensino pós-secundário":
        displayName = "Post-Secondary";
        break;
      case "Ensino superior":
        displayName = "Higher Education";
        break;
    }
    
    $("#education-level-filter-status").text(displayName);
  } else {
    $("#education-level-filter-status").text(`${count} education levels selected`);
  }
}

/**
 * Update education filters from data
 */
function updateEducationFiltersFromData() {
  // Reset education level buttons
  $("#education-level-buttons .age-group-btn").removeClass("active");
  $("#education-level-buttons .all-btn").addClass("active");
  
  // Reset filter status text
  $("#education-level-filter-status").text("All Education Levels");
}

// Export module functions
window.EducationFilters = {
  init: initEducationFilters,
  updateFromData: updateEducationFiltersFromData,
  updateStatus: updateEducationFilterStatus
};