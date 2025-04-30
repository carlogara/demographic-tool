/**
 * File: NationalityFilters.js
 * Location: demographic-tool/frontend/js/segment/filters/NationalityFilters.js
 * Purpose:
 *   - Handles nationality filter components
 *   - Manages nationality search, tag creation
 *   - FIXED: Improved handling of search results and special characters
 */

/**
 * Initialize the nationality filter with search and tags
 */
function initNationalityFilter() {
  const allNationalitiesBtn = $("#all-nationalities-btn");
  const nationalitySearch = $("#nationality-search");
  const searchResults = $("#nationality-search-results");
  const nationalityTags = $("#nationality-tags");
  
  // Always show search bar, but update UI state accordingly
  nationalitySearch.parent().show();
  
  // Remove any existing event handlers first to prevent duplicates
  allNationalitiesBtn.off("click");
  nationalitySearch.off("input");
  searchResults.off("click", ".search-result-item");
  nationalityTags.off("click", ".remove-tag");
  
  // All nationalities button toggle
  allNationalitiesBtn.on("click", function() {
    const wasActive = $(this).hasClass("active");
    
    if (!wasActive) {
      // Activate "All Nationalities"
      $(this).addClass("active");
      nationalityTags.empty();
      
      // Update filter state
      window.filterState.nationality.allSelected = true;
      window.filterState.nationality.selectedNationalities = [];
      
      // Update filter status
      $("#nationality-filter-status").text("All Nationalities");
    } else {
      // We still want to keep "All Nationalities" selected if clicked when active
      // Just do nothing here to maintain the active state
    }
  });
  
  // Nationality search
  nationalitySearch.on("input", function() {
    const searchTerm = $(this).val().trim().toLowerCase();
    
    if (searchTerm.length < 2) {
      searchResults.hide();
      return;
    }
    
    // Get available nationalities
    const allNationalities = getAllNationalities();
    
    // Filter by search term - normalize both the search term and the names
    const matchingNationalities = allNationalities.filter(nat => {
      if (!nat || !nat.name) return false;
      
      // Normalize string by removing diacritics and converting to lowercase
      const normalizedName = nat.name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
        
      const normalizedSearch = searchTerm
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      return normalizedName.includes(normalizedSearch);
    });
    
    // Build search results HTML
    if (matchingNationalities.length > 0) {
      let resultsHTML = "";
      
      matchingNationalities.forEach(nat => {
        // Check if already selected
        const isSelected = window.filterState.nationality.selectedNationalities.includes(nat.value);
        
        if (!isSelected) {
          // Escape any problematic characters in the name using textContent
          const div = document.createElement('div');
          div.textContent = nat.name;
          const escapedName = div.innerHTML;
          
          let continentHtml = '';
          if (nat.continent) {
            const continentDiv = document.createElement('div');
            continentDiv.textContent = nat.continent;
            continentHtml = `<span class="continent-indicator">(${continentDiv.innerHTML})</span>`;
          }
          
          resultsHTML += `
            <div class="search-result-item" data-value="${nat.value}">
              ${escapedName}
              ${continentHtml}
            </div>
          `;
        }
      });
      
      if (resultsHTML) {
        searchResults.html(resultsHTML);
        searchResults.show();
      } else {
        searchResults.html('<div class="no-results">All matching nationalities already selected</div>');
        searchResults.show();
      }
    } else {
      searchResults.html('<div class="no-results">No nationalities found</div>');
      searchResults.show();
    }
  });
  
  // Hide search results when clicking outside
  $(document).off("click.nationality-search").on("click.nationality-search", function(e) {
    if (!$(e.target).closest(".nationality-search-container").length) {
      searchResults.hide();
    }
  });
  
  // Add nationality tag when clicking on search result
  searchResults.on("click", ".search-result-item", function() {
    const value = $(this).data("value");
    const text = $(this).text().trim();
    
    // Create tag - escape the text content for safety
    const div = document.createElement('div');
    div.textContent = text;
    const escapedText = div.innerHTML;
    
    const tagHTML = `
      <div class="nationality-tag" data-value="${value}">
        ${escapedText}
        <span class="remove-tag"><i class="fas fa-times"></i></span>
      </div>
    `;
    
    nationalityTags.append(tagHTML);
    
    // Add to selected nationalities
    window.filterState.nationality.selectedNationalities.push(value);
    
    // When adding a nationality, deactivate "All Nationalities"
    allNationalitiesBtn.removeClass("active");
    window.filterState.nationality.allSelected = false;
    
    // Clear search and hide results
    nationalitySearch.val("").focus();
    searchResults.hide();
    
    // Update filter status
    updateNationalityFilterStatus();
  });
  
  // Remove tag when clicking on x
  nationalityTags.on("click", ".remove-tag", function() {
    const tag = $(this).closest(".nationality-tag");
    const value = tag.data("value");
    
    // Remove from selected nationalities
    window.filterState.nationality.selectedNationalities = window.filterState.nationality.selectedNationalities.filter(
      nat => nat !== value
    );
    
    // Remove tag
    tag.remove();
    
    // If no tags left, revert to all nationalities
    if (window.filterState.nationality.selectedNationalities.length === 0) {
      allNationalitiesBtn.addClass("active");
      window.filterState.nationality.allSelected = true;
      $("#nationality-filter-status").text("All Nationalities");
    } else {
      // Update filter status
      updateNationalityFilterStatus();
    }
  });
}

/**
 * Update the filter status text for nationalities
 */
function updateNationalityFilterStatus() {
  const count = window.filterState.nationality.selectedNationalities.length;
  
  if (count === 0) {
    $("#nationality-filter-status").text("All Nationalities");
  } else if (count === 1) {
    // Find display name from the full nationality list if possible
    const allNationalities = getAllNationalities();
    const selected = window.filterState.nationality.selectedNationalities[0];
    const nationality = allNationalities.find(nat => nat.value === selected);
    
    if (nationality) {
      $("#nationality-filter-status").text(nationality.name);
    } else {
      $("#nationality-filter-status").text(selected);
    }
  } else {
    $("#nationality-filter-status").text(`${count} selected nationalities`);
  }
}

/**
 * Get all available nationalities from the dataset
 * @returns {Array} Array of nationality objects with name, value, and continent
 */
function getAllNationalities() {
  // Safely check if locationData is available
  if (!window.locationData || !Array.isArray(window.locationData) || window.locationData.length === 0) {
    console.warn("locationData not available for nationality data");
    return [];
  }
  
  const maleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
  const femaleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
  
  if (!maleRow || !femaleRow) {
    console.warn("Could not find male/female total rows in locationData");
    return [];
  }
  
  const reservedKeys = [
    "Place of Residence", "Age Group", "Gender", "Total", 
    "freguesia_code", "municipio", "region"
  ];
  
  // Create a map for continents
  const continentMap = {
    "Europa": "Europe",
    "África": "Africa",
    "América": "America",
    "Ásia": "Asia",
    "Oceânia": "Oceania"
  };
  
  // Array to store nationalities
  const nationalities = [];
  
  // Add main categories - use only one "Portuguese" entry
  nationalities.push({ name: "Portuguese", value: "Portuguesa", continent: null });
  nationalities.push({ name: "Foreign (All)", value: "Estrangeira", continent: null });
  
  // Add continents
  Object.entries(continentMap).forEach(([key, value]) => {
    nationalities.push({ name: value, value: key, continent: null });
  });
  
  // Map specific nationalities to their continents
  const continentMapping = window.continentMapping || {
    "Europa": ["Alemanha", "Áustria", "Bélgica", "Bulgária", "Espanha", "França", "Irlanda", "Itália", "Luxemburgo",
              "Países Baixos", "Polónia", "Roménia", "Suécia", "Federação da Rússia", "Suíça", "Ucrânia"],
    "África": ["África do Sul", "Angola", "Cabo Verde", "Guiné-Bissau", "Moçambique", "São Tomé e Príncipe"],
    "América": ["Canadá", "Estados Unidos da América", "Argentina", "Brasil", "Venezuela"],
    "Ásia": ["Bangladeche", "China", "Índia", "Nepal", "Paquistão"],
    "Oceânia": []
  };
  
  // Get all nationality keys - exclude "Portuguesa" as we've already added it with English name
  // Also make sure to exclude the reserved keys and continent names
  const nationalityKeys = [];
  for (const key in maleRow) {
    if (!reservedKeys.includes(key) && 
        !Object.keys(continentMap).includes(key) && 
        key !== "Portuguesa" && 
        key !== "Estrangeira") {
      nationalityKeys.push(key);
    }
  }
  
  // Add individual nationality options
  nationalityKeys.forEach(nationality => {
    // Check if there are people with this nationality
    const maleCount = parseInt(maleRow[nationality]) || 0;
    const femaleCount = parseInt(femaleRow[nationality]) || 0;
    
    if (maleCount + femaleCount > 0) {
      // Find the continent for this nationality
      let continent = null;
      for (const [cont, countries] of Object.entries(continentMapping)) {
        if (countries.includes(nationality)) {
          continent = continentMap[cont] || cont;
          break;
        }
      }
      
      // Fix any encoding issues with double quotes
      const cleanName = nationality.replace(/"+/g, '"');
      
      nationalities.push({ 
        name: cleanName, 
        value: nationality, 
        continent: continent 
      });
    }
  });
  
  return nationalities;
}

/**
 * Update nationality filters from data
 */
function updateNationalityFiltersFromData() {
  // Reset the UI elements
  $("#all-nationalities-btn").addClass("active");
  $("#nationality-search").parent().show();
  $("#nationality-tags").empty();
  $("#nationality-filter-status").text("All Nationalities");
}

// Export module functions
window.NationalityFilters = {
  init: initNationalityFilter,
  updateFromData: updateNationalityFiltersFromData,
  updateStatus: updateNationalityFilterStatus,
  getAllNationalities: getAllNationalities
};