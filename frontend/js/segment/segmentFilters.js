/**
 * File: segmentFilters.js
 * Location: demographic-tool/frontend/js/segment/segmentFilters.js
 * Purpose:
 *   - Manages the filter dropdowns for segment analysis
 *   - Populates nationality and age group options
 *   - Handles filter selection and updates
 *   - UPDATED: Supports multi-select functionality
 */

/**
 * Populate the nationality dropdown with available nationalities
 * from the current dataset
 */
function populateNationalityDropdown() {
  const maleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
  const femaleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
  
  const reservedKeys = [
    "Place of Residence", "Age Group", "Gender", "Total", 
    "Portuguesa", "Estrangeira", "Europa", "África", 
    "América", "Ásia", "Oceânia", "freguesia_code", "municipio", "region"
  ];
  
  // Get all nationality keys
  const nationalityKeys = Object.keys(maleRow).filter(key => !reservedKeys.includes(key));
  
  // Build nationality options
  let nationalityOptions = '<option value="all">All Nationalities</option>';
  nationalityOptions += '<option value="Portuguesa">Portuguese</option>';
  nationalityOptions += '<option value="Estrangeira">Foreign (All)</option>';
  
  // Add continent options
  nationalityOptions += '<option value="Europa">Europe</option>';
  nationalityOptions += '<option value="África">Africa</option>';
  nationalityOptions += '<option value="América">America</option>';
  nationalityOptions += '<option value="Ásia">Asia</option>';
  nationalityOptions += '<option value="Oceânia">Oceania</option>';
  
  // Add individual nationality options
  nationalityKeys.forEach(nationality => {
    // Check if there are people with this nationality
    const maleCount = parseInt(maleRow[nationality]) || 0;
    const femaleCount = parseInt(femaleRow[nationality]) || 0;
    
    if (maleCount + femaleCount > 0) {
      nationalityOptions += `<option value="${nationality}">${nationality}</option>`;
    }
  });
  
  // Set the options
  $("#nationality-select").html(nationalityOptions);
  
  // Re-initialize Select2
  $("#nationality-select").select2('destroy').select2({
    placeholder: "Search for nationalities...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
}

/**
 * Populate age group dropdowns for both datasets
 */
function populateAgeGroupDropdowns() {
  // Get all unique age groups from the dataset
  const ageGroups = [...new Set(window.locationData
    .filter(row => row["Age Group"] !== "Total")
    .map(row => row["Age Group"]))];
  
  // Sort age groups
  ageGroups.sort((a, b) => {
    // Extract first number from age group (e.g., "0-4" -> 0)
    const aNum = parseInt(a.match(/\d+/)[0]);
    const bNum = parseInt(b.match(/\d+/)[0]);
    return aNum - bNum;
  });
  
  // Build options for nationality dataset (detailed age groups)
  let ageOptions = '<option value="all">All Age Groups</option>';
  ageGroups.forEach(age => {
    ageOptions += `<option value="${age}">${age}</option>`;
  });
  $("#age-group-select").html(ageOptions);
  
  // Build options for education dataset (broader age groups)
  // Get age groups from the studies dataset
  let eduAgeGroups = [];
  
  if (window.studiesDataset && window.studiesDataset.length > 0) {
    eduAgeGroups = [...new Set(window.studiesDataset
      .filter(row => row["Age Group"] !== "Total")
      .map(row => row["Age Group"]))];
    
    // Sort education age groups
    eduAgeGroups.sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)[0]);
      const bNum = parseInt(b.match(/\d+/)[0]);
      return aNum - bNum;
    });
  } else {
    // Fallback to a predefined list if studies dataset is not available
    eduAgeGroups = ["0-14", "15-19", "20-24", "25-64", "65-74", "75+"];
  }
  
  let eduAgeOptions = '<option value="all">All Age Groups</option>';
  eduAgeGroups.forEach(age => {
    eduAgeOptions += `<option value="${age}">${age}</option>`;
  });
  $("#edu-age-group-select").html(eduAgeOptions);
  
  // Re-initialize Select2
  $("#age-group-select").select2('destroy').select2({
    placeholder: "Search for age groups...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
  
  $("#edu-age-group-select").select2('destroy').select2({
    placeholder: "Search for age groups...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
}

/**
 * Update the segment name based on current filter selections
 */
function updateSegmentName() {
  let segmentName = "";
  
  if ($("#nationality-dataset-btn").hasClass("active")) {
    // Nationality dataset
    const nationalities = $("#nationality-select").val() || ['all'];
    const ageGroups = $("#age-group-select").val() || ['all'];
    const genders = $("#gender-select").val() || ['all'];
    
    if (!nationalities.includes('all') && nationalities.length > 0) {
      if (nationalities.length === 1) {
        segmentName = nationalities[0];
      } else {
        segmentName = `Multiple Nationalities (${nationalities.length})`;
      }
    } else {
      segmentName = "All Nationalities";
    }
    
    if (!ageGroups.includes('all') && ageGroups.length > 0) {
      if (ageGroups.length === 1) {
        segmentName += ` (Age: ${ageGroups[0]})`;
      } else {
        segmentName += ` (Ages: ${ageGroups.length} groups)`;
      }
    }
    
    if (!genders.includes('all') && genders.length > 0) {
      if (genders.length === 1) {
        segmentName += ` (${genders[0] === "H" ? "Male" : "Female"})`;
      } else {
        segmentName += ` (Both genders)`;
      }
    }
  } else {
    // Education dataset
    const educationLevels = $("#education-level-select").val() || ['all'];
    const ageGroups = $("#edu-age-group-select").val() || ['all'];
    const genders = $("#edu-gender-select").val() || ['all'];
    
    if (!educationLevels.includes('all') && educationLevels.length > 0) {
      if (educationLevels.length === 1) {
        segmentName = educationLevels[0];
      } else {
        segmentName = `Multiple Education Levels (${educationLevels.length})`;
      }
    } else {
      segmentName = "All Education Levels";
    }
    
    if (!ageGroups.includes('all') && ageGroups.length > 0) {
      if (ageGroups.length === 1) {
        segmentName += ` (Age: ${ageGroups[0]})`;
      } else {
        segmentName += ` (Ages: ${ageGroups.length} groups)`;
      }
    }
    
    if (!genders.includes('all') && genders.length > 0) {
      if (genders.length === 1) {
        segmentName += ` (${genders[0] === "H" ? "Male" : "Female"})`;
      } else {
        segmentName += ` (Both genders)`;
      }
    }
  }
  
  $("#segment-name").text(segmentName);
}

/**
 * Handle the special "All" option behavior in select dropdowns
 * @param {jQuery} $select - The jQuery object for the select element
 */
function handleAllOption($select) {
  const selectedValues = $select.val() || [];
  
  // If 'all' is selected, clear other selections
  if (selectedValues.includes('all')) {
    if (selectedValues.length > 1) {
      $select.val(['all']).trigger('change.select2');
    }
  }
  // If other options are selected and 'all' was previously selected, remove 'all'
  else if (selectedValues.length > 0) {
    const hasAll = $select.find('option[value="all"]:selected').length > 0;
    if (hasAll) {
      const newSelection = selectedValues.filter(val => val !== 'all');
      $select.val(newSelection).trigger('change.select2');
    }
  }
}

/**
 * Initialize filter-related event handlers
 */
function initSegmentFilters() {
  // Initialize Select2 on dropdowns
  $("#nationality-select").select2({
    placeholder: "Search for nationalities...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
  
  $("#education-level-select").select2({
    placeholder: "Search for education levels...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
  
  $("#age-group-select").select2({
    placeholder: "Search for age groups...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
  
  $("#edu-age-group-select").select2({
    placeholder: "Search for age groups...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false
  });
  
  $("#gender-select").select2({
    placeholder: "Select genders...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false,
    minimumResultsForSearch: Infinity
  });
  
  $("#edu-gender-select").select2({
    placeholder: "Select genders...",
    allowClear: true,
    multiple: true,
    closeOnSelect: false,
    minimumResultsForSearch: Infinity
  });
  
  // Initialize region view select with Select2
  $("#region-view-mode").select2({
    minimumResultsForSearch: Infinity // Disable search since we only have 2 options
  });
  
  // Handle 'All' option special case for each select
  $('#nationality-select, #age-group-select, #gender-select, #education-level-select, #edu-age-group-select, #edu-gender-select').on('change', function() {
    handleAllOption($(this));
  });
  
  // Wire up dataset toggle buttons
  $("#nationality-dataset-btn").on("click", function() {
    $(".dataset-btn").removeClass("active");
    $(this).addClass("active");
    $("#nationality-filters").show();
    $("#education-filters").hide();
    updateSegmentName();
  });

  $("#education-dataset-btn").on("click", function() {
    $(".dataset-btn").removeClass("active");
    $(this).addClass("active");
    $("#nationality-filters").hide();
    $("#education-filters").show();
    updateSegmentName();
  });

  // Wire up display mode toggle
  $("input[name='display-mode']").on("change", function() {
    const displayMode = $("input[name='display-mode']:checked").val();
    updateSegmentChart(displayMode);
  });

  // Wire up filter buttons
  $("#apply-filters-btn").on("click", function() {
    updateSegmentName();
    updateSegmentChart($("input[name='display-mode']:checked").val());
  });

  $("#apply-edu-filters-btn").on("click", function() {
    updateSegmentName();
    updateSegmentChart($("input[name='display-mode']:checked").val());
  });
  
  // Add filter summary containers
  $("#nationality-filters").append('<div class="filter-summary" id="nationality-filter-summary"></div>');
  $("#education-filters").append('<div class="filter-summary" id="education-filter-summary"></div>');
}

// Export functions globally
window.segmentFiltersModule = {
  init: initSegmentFilters,
  populateNationalityDropdown: populateNationalityDropdown,
  populateAgeGroupDropdowns: populateAgeGroupDropdowns,
  updateSegmentName: updateSegmentName
};