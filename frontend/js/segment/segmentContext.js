/**
 * File: segmentContext.js
 * Location: demographic-tool/frontend/js/segment/segmentContext.js
 * Purpose:
 *   - Manages comparison context for segment analysis
 *   - Updates parent location references and buttons
 *   - Handles context toggling between direct parent and region
 */

/**
 * Update the comparison context buttons based on location type
 */
function updateComparisonContextButtons() {
  const selectedLocation = $("#current-location-name").text();
  if (!selectedLocation) return;
  
  const locationData = window.dataset.find(row => row["Place of Residence"] === selectedLocation);
  if (!locationData) return;
  
  const locationType = getLocationType(selectedLocation);
  
  // Clear the existing content
  $("#comparison-context-buttons").empty();
  
  if (locationType === "freguesia" && locationData.municipio && locationData.region) {
    // For freguesias, show município and region buttons
    $("#comparison-context-buttons").html(`
      <button class="comparison-context-btn active" data-context="direct-parent">${locationData.municipio}</button>
      <button class="comparison-context-btn" data-context="region">${locationData.region}</button>
    `);
  } else if (locationType === "municipio" && locationData.region) {
    // For municipalities, show self and region buttons
    $("#comparison-context-buttons").html(`
      <button class="comparison-context-btn active" data-context="direct-parent">${selectedLocation}</button>
      <button class="comparison-context-btn" data-context="region">${locationData.region}</button>
    `);
  }
  
  // Show the toggle only if we have buttons
  const hasButtons = $("#comparison-context-buttons").children().length > 0;
  $("#comparison-context-toggle").toggle(hasButtons);
}

/**
 * Update the comparison context based on the selected option
 * @param {string} contextMode - "direct-parent" or "region"
 */
function updateComparisonContext(contextMode) {
  const selectedLocation = $("#current-location-name").text();
  if (!selectedLocation) return;
  
  const locationType = getLocationType(selectedLocation);
  if (locationType !== "freguesia" && locationType !== "municipio") return;
  
  const locationData = window.dataset.find(row => row["Place of Residence"] === selectedLocation);
  
  if (locationData) {
    if (contextMode === "direct-parent") {
      // Use the municipality as parent for freguesias
      if (locationType === "freguesia") {
        $("#parent-location-name").text(locationData.municipio);
      } else {
        // For municipalities, use the municipality itself as parent
        $("#parent-location-name").text(selectedLocation);
      }
      
      // Hide region view toggle
      $("#region-view-toggle").hide();
      
    } else if (contextMode === "region") {
      // Use the region as parent for both freguesias and municipalities
      $("#parent-location-name").text(locationData.region);
      
      // Show region view toggle when in region context
      $("#region-view-toggle").show();
    }
  }
}

/**
 * Initialize context-related event handlers
 */
function initComparisonContext() {
  // Wire up comparison context buttons
  $(document).on("click", ".comparison-context-btn", function() {
    // Remove active class from all context buttons
    $(".comparison-context-btn").removeClass("active");
    
    // Add active class to clicked button
    $(this).addClass("active");
    
    // Get the context value from the button's data attribute
    const contextMode = $(this).data("context");
    
    // Store current context mode in session
    sessionStorage.setItem('comparisonContext', contextMode);
    
    // Update the parent location name based on the selected context
    updateComparisonContext(contextMode);
    
    // Update segment chart with the new context
    updateSegmentChart($("input[name='display-mode']:checked").val());
  });
  
  // Wire up region view mode toggle
  $("#region-view-mode").on("change", function() {
    const viewMode = $(this).val();
    // Store current view mode in session
    sessionStorage.setItem('regionViewMode', viewMode);
    
    // Update segment chart with the new view mode
    updateSegmentChart($("input[name='display-mode']:checked").val());
  });
}

// Export functions globally
window.segmentContextModule = {
  init: initComparisonContext,
  updateComparisonContextButtons: updateComparisonContextButtons,
  updateComparisonContext: updateComparisonContext
};