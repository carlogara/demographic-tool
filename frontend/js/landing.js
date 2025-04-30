/**
 * File: landing.js
 * Location: demographic-tool/frontend/js/landing.js
 * Purpose:
 *   - Handles the landing page search functionality
 *   - Manages the transition from landing page to data dashboard
 *   - Handles returning from dashboard to landing page
 *   - UPDATED: Ensures proper cleanup when returning to landing page
 */

$(document).ready(function() {
  // Check if a location was previously selected and stored
  const previousLocation = sessionStorage.getItem('selectedLocation');
  if (previousLocation) {
    // If there was, go directly to the dashboard with that location
    showDashboard();
    // Small delay to ensure data is loaded before updating
    setTimeout(() => {
      updateData(previousLocation);
    }, 300);
  }

  // Landing page search functionality
  const landingSearchInput = $('#landing-search');
  const landingSearchResults = $('#landing-search-results');

  // Ensure the dropdown has the same width as the input
  function matchDropdownWidth() {
    const inputWidth = landingSearchInput.outerWidth();
    landingSearchResults.css('width', inputWidth + 'px');
  }

  // On user typing in landing search:
  landingSearchInput.on('input', function() {
    const searchTerm = this.value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!searchTerm) {
      landingSearchResults.hide();
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
      landingSearchResults.html(resultsHTML).show();
    } else {
      landingSearchResults.html('<div class="search-result-item">Nenhum resultado encontrado</div>').show();
    }
  });

  // On focus, update dropdown width
  landingSearchInput.on('focus', function() {
    matchDropdownWidth();
  });

  // Handle window resize
  $(window).on('resize', function() {
    if (landingSearchResults.is(':visible')) {
      matchDropdownWidth();
    }
  });

  // On click in landing search dropdown:
  landingSearchResults.on('click', '.search-result-item', function() {
    const selectedValue = $(this).data('value');
    const selectedType = $(this).data('type');

    // Clear the search input right after selection
    landingSearchInput.val('');
    landingSearchResults.hide();

    // Store the selected location in session storage
    sessionStorage.setItem('selectedLocation', selectedValue);

    // Show the dashboard and update data
    showDashboard();
    updateData(selectedValue, selectedType); // from dataHandler.js
  });

  // Home button (back to landing)
  $('#back-to-landing').on('click', function() {
    showLanding();
    
    // Clear the session storage to force a fresh state
    sessionStorage.removeItem('selectedLocation');
    
    // Reset the intuitive filters flag to ensure proper re-initialization on next search
    if (typeof window.intuitiveFiltersModule !== 'undefined' && 
        typeof window.intuitiveFiltersModule.reset === 'function') {
      window.intuitiveFiltersModule.reset();
      console.log("Reset intuitive filters initialization flag");
    }
  });

  // Hide the landing dropdown if user clicks elsewhere
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.landing-search-container').length) {
      landingSearchResults.hide();
    }
  });

  // Sync the landing search with header search
  $('#location-search').on('change', function() {
    const value = $(this).val();
    sessionStorage.setItem('selectedLocation', value);
  });
});

/**
 * Shows the landing page and hides the dashboard
 */
function showLanding() {
  $('#landing-page').show();
  $('#data-dashboard').hide();

  // Clear any search inputs
  $('#landing-search').val('');
  $('#location-search').val('');
}

/**
 * Shows the dashboard and hides the landing page
 */
function showDashboard() {
  $('#landing-page').hide();
  $('#data-dashboard').show();

  // Make sure the dashboard container is at the top
  window.scrollTo(0, 0);
}