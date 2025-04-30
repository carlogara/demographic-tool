/**
 * File: navigation.js
 * Location: demographic-tool/frontend/js/navigation.js
 * Purpose:
 *   - Handles navigation between location overview and segment analysis views
 *   - Updates navigation UI based on selected location
 *   - Manages parent location references
 *   - Provides region-specific toggling between municipalities and freguesias
 */

$(document).ready(function() {
  // Toggle view button click handler
  $('#toggle-view-button').on('click', function(e) {
    e.preventDefault();
    const isInOverviewMode = $('#location-overview').is(':visible');
    
    if (isInOverviewMode) {
      // Switch to segment analysis view
      $('#location-overview').hide();
      $('#segment-analysis').show();
      
      // Update segment button text (without adding active class)
      $('#segment-button-text').html(`VOLTAR PARA <span style="color: #f9b410; font-weight: 700;">${$('#current-location-name').text()}</span>`);
      
      // Check if this is a region and show the view toggle if it is
      const locationType = getLocationType($('#current-location-name').text());
      if (locationType === 'region') {
        $('#region-view-toggle').show();
      } else {
        $('#region-view-toggle').hide();
      }
      
    } else {
      // Switch to location overview
      $('#segment-analysis').hide();
      $('#location-overview').show();
      
      // Update segment button text back to original
      updateSegmentButtonText();
    }
    
    // Scroll to top of page
    window.scrollTo(0, 0);
  });
  
  // Back to landing page handler
  $('#back-to-landing').on('click', function(e) {
    e.preventDefault();
    showLanding();
    
    // Clear the session storage to force a fresh state
    sessionStorage.removeItem('selectedLocation');
    
    // Reset the intuitive filters flag to ensure proper re-initialization on next search
    if (typeof window.intuitiveFiltersModule !== 'undefined' && 
        typeof window.intuitiveFiltersModule.reset === 'function') {
      window.intuitiveFiltersModule.reset();
    }
  });
  
  // Region view toggle handler (Municipalities vs Freguesias)
  $('#region-view-mode').on('change', function() {
    const viewMode = $(this).val();
    // Store current view mode in session
    sessionStorage.setItem('regionViewMode', viewMode);
    
    // Update segment chart with the new view mode
    updateSegmentChart($("input[name='display-mode']:checked").val());
  });
});

/**
 * Updates the navigation bar with the current location name
 * Called from dataHandler.js after updateData()
 * 
 * @param {string} locationName - The selected location name
 */
function updateNavigationLocation(locationName) {
  // Update the current location name in the header
  $('#current-location-name').text(locationName);
  
  // Update the segment button text based on location type
  updateSegmentButtonText();
}

/**
 * Updates the segment button text based on the current location type
 */
function updateSegmentButtonText() {
  const selectedLocation = $('#current-location-name').text();
  if (!selectedLocation) return;
  
  // Determine the location type
  const locationType = getLocationType(selectedLocation);
  
  // Set button text based on location type
  if (locationType === "freguesia") {
    // For freguesias, show the parent municipality
    const locationData = window.dataset.find(row => row["Place of Residence"] === selectedLocation);
    if (locationData && locationData.municipio) {
      $('#segment-button-text').html(`COMPARAR SEGMENTOS EM <span style="color: #f9b410; font-weight: 700;">${locationData.municipio}</span>`);
      $('#parent-location-name').text(locationData.municipio);
    } else {
      $('#segment-button-text').html(`COMPARAR SEGMENTOS EM <span style="color: #f9b410; font-weight: 700;">LOCAL</span>`);
    }
  } else if (locationType === "municipio") {
    // For municipalities, show the municipality name itself
    $('#segment-button-text').html(`COMPARAR SEGMENTOS EM <span style="color: #f9b410; font-weight: 700;">${selectedLocation}</span>`);
    $('#parent-location-name').text(selectedLocation);
  } else if (locationType === "region") {
    // For regions, show the region name itself
    $('#segment-button-text').html(`COMPARAR SEGMENTOS EM <span style="color: #f9b410; font-weight: 700;">${selectedLocation}</span>`);
    $('#parent-location-name').text(selectedLocation);
  }
}

/**
 * Updates the parent location reference in the navigation button
 * Based on the selected location's type (freguesia, município, or region)
 */
function updateParentLocationInNav() {
  const selectedLocation = $('#current-location-name').text();
  if (!selectedLocation) return;
  
  // Update button text based on location type
  updateSegmentButtonText();
}