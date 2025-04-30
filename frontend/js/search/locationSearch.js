/**
 * File: locationSearch.js
 * Location: demographic-tool/frontend/js/search/locationSearch.js
 * Purpose:
 *   - Wires up your #location-search input and #search-results dropdown
 *   - On selection, calls updateData(...) from dataHandler.js
 *   - Supports searching for freguesias, municípios, and regions
 */

function initLocationSearch() {
  // Initialize both search inputs (landing page and header)
  initSearchInput('#location-search', '#search-results');
  // The landing search is handled in landing.js
}

/**
 * Initialize a search input with results dropdown
 * 
 * @param {string} inputSelector - The selector for the search input
 * @param {string} resultsSelector - The selector for the results dropdown
 */
function initSearchInput(inputSelector, resultsSelector) {
  const searchInput = $(inputSelector);
  const searchResults = $(resultsSelector);

  // Ensure the dropdown has the same width as the input
  function matchDropdownWidth() {
    const inputWidth = searchInput.outerWidth();
    searchResults.css('width', inputWidth + 'px');
  }

  // On user typing:
  searchInput.on('input', function() {
    const searchTerm = this.value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
      
    if (!searchTerm) {
      searchResults.hide();
      return;
    }
    
    // Match dropdown width before showing results
    matchDropdownWidth();

    // Filter dataset by Place of Residence
    const matches = window.dataset.filter(row => {
      const text = row["Place of Residence"]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return text.includes(searchTerm);
    });

    // We create a Map to keep unique location names
    const uniqueLocationsMap = new Map();
    matches.forEach(row => {
      if (!uniqueLocationsMap.has(row["Place of Residence"])) {
        const locationType = getLocationType(row["Place of Residence"]);
        uniqueLocationsMap.set(row["Place of Residence"], {
          text: row["Place of Residence"],
          municipio: row["municipio"],
          region: row["region"],
          type: locationType
        });
      }
    });
    const uniqueMatches = Array.from(uniqueLocationsMap.values());

    if (uniqueMatches.length > 0) {
      const resultsHTML = uniqueMatches
        .map(match => {
          // Add badge for location type
          let badge = '';
          if (match.type === 'region') {
            badge = '<span class="location-badge region-badge">Region</span>';
          } else if (match.type === 'municipio') {
            badge = '<span class="location-badge municipio-badge">Município</span>';
          } else {
            badge = '<span class="location-badge freguesia-badge">Freguesia</span>';
          }
          
          return `<div class="search-result-item" data-value="${match.text}" data-type="${match.type}">${match.text} ${badge}</div>`;
        })
        .join('');
      searchResults.html(resultsHTML).show();
    } else {
      searchResults.html('<div class="search-result-item">Nenhum resultado encontrado</div>').show();
    }
  });

  // On focus, update dropdown width
  searchInput.on('focus', function() {
    matchDropdownWidth();
  });

  // Handle window resize
  $(window).on('resize', function() {
    if (searchResults.is(':visible')) {
      matchDropdownWidth();
    }
  });

  // On click in dropdown:
  searchResults.on('click', '.search-result-item', function() {
    const selectedValue = $(this).data('value');
    const selectedType = $(this).data('type');

    // Clear the search input after selection for better UX
    searchInput.val('');
    searchResults.hide();

    // Once user selects a location, update the data
    updateData(selectedValue, selectedType); // from dataHandler.js
  });

  // Hide the dropdown if user clicks elsewhere
  $(document).on('click', function(e) {
    if (!$(e.target).closest(inputSelector).length && 
        !$(e.target).closest(resultsSelector).length) {
      searchResults.hide();
    }
  });
}