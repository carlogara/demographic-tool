/**
 * File: main.js
 * Location: demographic-tool/frontend/js/main.js
 * Purpose:
 *   - The main "entry point" that runs when the DOM is ready.
 *   - Initializes components after data is loaded.
 *   - UPDATED: Added loading of disability data
 */

$(document).ready(function() {
  // Use Promise.all to load all datasets before initialization.
  // Updated to include the disability dataset
  Promise.all([loadData(), loadStudiesData(), loadDisabilityData()]).then(() => {
    // If no location is selected yet, focus on the landing search field
    if (!sessionStorage.getItem('selectedLocation')) {
      $('#landing-search').focus();
    }

    // Set up search input logic + result click logic
    initLocationSearch(); // This wires up the header search input

    // Initialize the nationality chart + age distribution chart
    initNationalityChart();       // from nationalityChart.js
    initAgeDistributionChart();   // from ageDistributionChart.js

    // Initialize the education level chart using the studies dataset.
    if (window.studiesDataset && window.studiesDataset.length > 0) {
      // Get total population row (assuming same structure as your demographic data)
      const totalRow = window.studiesDataset.find(row => 
        row["Age Group"] === "Total" && 
        (row["Gender"] === "H" || row["Gender"] === "M")
      );
      
      if (totalRow) {
        const educationLevels = [
          "Nenhum", 
          "Ensino básico", 
          "Ensino secundário", 
          "Ensino pós-secundário", 
          "Ensino superior"
        ];
        
        // Get values for each education level
        const labels = educationLevels;
        const values = labels.map(level => parseInt(totalRow[level]) || 0);
        
        // Initialize the new Education Level Chart
        educationChartModule.init('educationLevelChart', { labels, values });
      } else {
        console.warn("Could not find total population row in studies dataset.");
      }
    } else {
      console.warn("Studies dataset not loaded or empty.");
    }

    // Initialize the disability chart if data is loaded
    if (window.disabilityDataset && window.disabilityDataset.length > 0) {
      if (window.disabilityChartModule) {
        window.disabilityChartModule.init();
        window.disabilityChartModule.populateAgeGroupButtons();
      }
    } else {
      console.warn("Disability dataset not loaded or empty.");
    }

    // Initialize the segment focus module
    // This will set up the basic segment analysis structure but not initialize the
    // intuitive filters yet since locationData might not be ready for specific location
    if (window.segmentFocusModule && typeof window.segmentFocusModule.init === 'function') {
      window.segmentFocusModule.init();
    }

    // Set up pretty chart colors
    Chart.defaults.color = '#555';
    Chart.defaults.borderColor = '#eee';
    Chart.defaults.font.family = '"Segoe UI", Arial, sans-serif';
    
    // Handle the navigation between overview and segment analysis
    $('#toggle-view-button').on('click', function() {
      if ($('#location-overview').is(':visible')) {
        // Save the current filter state when switching to segment view
        if (window.segmentFocusModule && typeof window.segmentFocusModule.saveFilterState === 'function') {
          window.segmentFocusModule.saveFilterState();
        }
      } else {
        // Restore the filter state when returning to overview
        if (window.locationData && window.locationData.length > 0) {
          if (window.intuitiveFiltersModule && typeof window.intuitiveFiltersModule.restoreState === 'function') {
            window.intuitiveFiltersModule.restoreState();
          }
        }
      }
    });
    
    // Additional event listeners for better UX
    $(window).on('beforeunload', function() {
      // Save filter state before page unload
      if (window.segmentFocusModule && typeof window.segmentFocusModule.saveFilterState === 'function') {
        window.segmentFocusModule.saveFilterState();
      }
    });
    
    // Check if a location was previously selected and restore it
    const previousLocation = sessionStorage.getItem('selectedLocation');
    if (previousLocation) {
      console.log("Restoring previous location:", previousLocation);
      // Update the data for the selected location
      updateData(previousLocation);
      
      // After data is updated, locationData will be available, so we can restore filters
      setTimeout(() => {
        if (window.intuitiveFiltersModule && typeof window.intuitiveFiltersModule.restoreState === 'function' &&
            window.locationData && window.locationData.length > 0) {
          window.intuitiveFiltersModule.restoreState();
        }
      }, 300);
    }

  }).catch(error => {
    console.error("Error loading datasets:", error);
    // Show an error message to the user
    alert("Error loading data. Please try refreshing the page.");
  });
});