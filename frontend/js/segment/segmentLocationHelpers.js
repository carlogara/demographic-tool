/**
 * File: segmentLocationHelpers.js
 * Location: demographic-tool/frontend/js/segment/segmentLocationHelpers.js
 * Purpose:
 *   - Provides helper functions for handling location data in the segment analysis
 *   - Ensures correct type-based filtering of locations
 *   - Prevents duplicate municipality/freguesia issues
 */

/**
 * Helper function to get unique locations based on type
 * Ensures we don't get duplicates when location names appear in multiple contexts
 * 
 * @param {string} parentLocation - The parent location name
 * @param {string} viewMode - "municipality" or "freguesia"
 * @param {Array} dataset - The dataset to search in
 * @returns {Array} Array of unique location objects with name and type
 */
function getUniqueLocations(parentLocation, viewMode, dataset) {
  // Use a Map to store unique locations with their types
  const uniqueLocationsMap = new Map();
  
  if (viewMode === "municipality") {
    // Get all municipality rows that belong to the region
    dataset
      .filter(row => 
        row.region === parentLocation && 
        row.municipio && 
        // Ensure we only include each município once by checking the freguesia_code length
        (row.municipio !== row["Place of Residence"] || 
         (row.municipio === row["Place of Residence"] && row.freguesia_code && row.freguesia_code.length === 4))
      )
      .forEach(row => {
        const municipio = row.municipio;
        
        // Only add if not already in the map
        if (!uniqueLocationsMap.has(municipio)) {
          uniqueLocationsMap.set(municipio, {
            name: municipio,
            type: 'municipio'
          });
        }
      });
  } else {
    // Get all freguesias in this region
    dataset
      .filter(row => 
        row.region === parentLocation && 
        row["Place of Residence"] !== parentLocation &&
        // Include only actual freguesias (code length >= 6)
        row.freguesia_code && row.freguesia_code.length >= 6
      )
      .forEach(row => {
        const freguesia = row["Place of Residence"];
        
        // Only add if not already in the map
        if (!uniqueLocationsMap.has(freguesia)) {
          uniqueLocationsMap.set(freguesia, {
            name: freguesia,
            type: 'freguesia'
          });
        }
      });
  }
  
  return Array.from(uniqueLocationsMap.values());
}

/**
 * Helper function to get rows for a location with the correct type
 * 
 * @param {string} location - The location name
 * @param {string} locationType - The expected location type
 * @param {Array} dataset - The dataset to search in
 * @returns {Array} Filtered dataset rows
 */
function getLocationRowsByTypeForDataset(location, locationType, dataset) {
  // Get all rows for this location
  const allRows = dataset.filter(row => row["Place of Residence"] === location);
  
  if (allRows.length === 0) return [];
  
  // If location type is a município, ensure we use the correct rows
  if (locationType === "municipio") {
    return allRows.filter(row => {
      // Check the freguesia_code length (4 for municipios)
      return row.freguesia_code && row.freguesia_code.length === 4;
    });
  }
  
  // If location type is a freguesia, ensure we use the correct rows
  if (locationType === "freguesia") {
    return allRows.filter(row => {
      // Check the freguesia_code length (>= 6 for freguesias)
      return row.freguesia_code && row.freguesia_code.length >= 6;
    });
  }
  
  // For regions or fallback, return all rows
  return allRows;
}

// Export functions globally
window.segmentLocationHelpers = {
  getUniqueLocations: getUniqueLocations,
  getLocationRowsByTypeForDataset: getLocationRowsByTypeForDataset
};