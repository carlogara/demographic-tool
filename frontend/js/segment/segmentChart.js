/**
 * File: segmentChart.js
 * Location: demographic-tool/frontend/js/segment/segmentChart.js
 * Purpose:
 *   - Creates and updates the segment distribution chart
 *   - Processes data for visualization
 *   - Handles chart configuration and display modes
 *   - UPDATED: Supports multi-select functionality
 */

// Global chart reference
let segmentDistributionChart = null;

/**
 * Initialize the segment distribution chart
 */
function initSegmentChart() {
  const ctx = document.getElementById('segmentDistributionChart').getContext('2d');
  segmentDistributionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Percentage',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const displayMode = $("input[name='display-mode']:checked").val();
              const value = context.raw;
              if (displayMode === "percentage") {
                return `${value.toFixed(2)}%`;
              } else {
                return `${value.toLocaleString()} people`;
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Location'
          }
        }
      }
    }
  });
}

/**
 * Update the segment distribution chart based on current selections
 * 
 * @param {string} displayMode - "percentage" or "absolute"
 */
function updateSegmentChart(displayMode) {
  // Show the results container when updating the chart
  $(".results-container").show();
  
  const isNationalityDataset = $("#nationality-dataset-btn").hasClass("active");
  const parentLocation = $("#parent-location-name").text();
  const selectedLocation = $("#current-location-name").text();
  const locationType = getLocationType(selectedLocation);
  
  // Get all locations within the parent location
  let childLocations = [];
  let locationData = [];
  
  // Check if we're in region context
  const isRegionContext = $(".comparison-context-btn[data-context='region']").hasClass("active");
  
  // Get region view mode (used when comparing in region context or when in a region)
  const regionViewMode = $("#region-view-mode").val() || "municipality";
  
  // Choose the correct dataset based on the active tab
  const datasetToUse = isNationalityDataset ? window.dataset : window.studiesDataset;
  
  // Get unique locations based on context and type
  if (locationType === "region" || isRegionContext) {
    // We're either in a region view or using region context from freguesia/municipality
    // Get unique locations for the region based on view mode
    const regionName = locationType === "region" ? selectedLocation : parentLocation;
    const uniqueLocations = window.segmentLocationHelpers.getUniqueLocations(regionName, regionViewMode, datasetToUse);
    childLocations = uniqueLocations.map(loc => loc.name);
  } else {
    // Normal case - get all freguesias in municipality
    childLocations = [...new Set(datasetToUse
      .filter(row => 
        row.municipio === parentLocation && 
        row["Place of Residence"] !== parentLocation &&
        // Ensure we only get actual freguesias (code length >= 6)
        row.freguesia_code && row.freguesia_code.length >= 6
      )
      .map(row => row["Place of Residence"]))];
  }
  
  if (isNationalityDataset) {
    // Get filters from nationality dataset - now as arrays
    const nationalities = $("#nationality-select").val() || ['all'];
    const ageGroups = $("#age-group-select").val() || ['all'];
    const genders = $("#gender-select").val() || ['all'];
    
    // For each child location, calculate the segment value
    childLocations.forEach(location => {
      // Get the right type of location rows based on context and view mode
      let locationRows;
      
      if ((locationType === "region" || isRegionContext) && regionViewMode === "municipality") {
        // For region view showing municipalities, get the município rows
        locationRows = window.segmentLocationHelpers.getLocationRowsByTypeForDataset(location, "municipio", datasetToUse);
      } else {
        // For freguesias, get the freguesia rows
        locationRows = window.segmentLocationHelpers.getLocationRowsByTypeForDataset(location, "freguesia", datasetToUse);
      }
      
      // Skip if no data found for this location
      if (locationRows.length === 0) {
        console.log(`No data for location: ${location}`);
        return;
      }
      
      // Determine total population for this location
      const totalRow = locationRows.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
      const totalRowF = locationRows.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
      const totalPopulation = (parseInt(totalRow["Total"]) || 0) + (parseInt(totalRowF["Total"]) || 0);
      
      // Skip if no population
      if (totalPopulation === 0) return;
      
      // Filter by age groups - allow multiple
      let filteredData = locationRows;
      if (!ageGroups.includes('all')) {
        filteredData = filteredData.filter(row => ageGroups.includes(row["Age Group"]));
      }
      
      // Filter by genders - allow multiple
      if (!genders.includes('all')) {
        filteredData = filteredData.filter(row => genders.includes(row["Gender"]));
      } else {
        // If "all genders", we need both H and M
        filteredData = filteredData.filter(row => row["Gender"] === "H" || row["Gender"] === "M");
      }
      
      // Skip if no data matches the filters
      if (filteredData.length === 0) return;
      
      // Calculate segment value
      let segmentValue = 0;

      // Check if we're using specific age groups or total
      if (!ageGroups.includes('all')) {
        // For specific age groups, calculate for all selected values
        filteredData.forEach(row => {
          if (nationalities.includes('all')) {
            // Use total if "all nationalities" selected
            segmentValue += parseInt(row["Total"]) || 0;
          } else {
            // Sum all selected nationalities
            nationalities.forEach(nationality => {
              segmentValue += parseInt(row[nationality]) || 0;
            });
          }
        });
      } else {
        // For "all age groups", use only Total rows to avoid double counting
        const totalRows = filteredData.filter(row => row["Age Group"] === "Total");
        
        totalRows.forEach(row => {
          if (nationalities.includes('all')) {
            segmentValue += parseInt(row["Total"]) || 0;
          } else {
            // Sum all selected nationalities
            nationalities.forEach(nationality => {
              segmentValue += parseInt(row[nationality]) || 0;
            });
          }
        });
      }
      
      // Skip if no segment value
      if (segmentValue === 0) return;
      
      // Calculate percentage if needed
      const percentage = totalPopulation > 0 ? (segmentValue / totalPopulation) * 100 : 0;
      
      // Add to location data
      locationData.push({
        location: location,
        value: displayMode === "percentage" ? percentage : segmentValue
      });
    });
  } else {
    // Education dataset logic - similar changes for multiple selections
    const educationLevels = $("#education-level-select").val() || ['all'];
    const ageGroups = $("#edu-age-group-select").val() || ['all'];
    const genders = $("#edu-gender-select").val() || ['all'];
    
    // For each child location, calculate the segment value
    childLocations.forEach(location => {
      // Get the right type of location rows based on context and view mode
      let locationRows;
      
      if ((locationType === "region" || isRegionContext) && regionViewMode === "municipality") {
        // For region view showing municipalities, get the município rows
        locationRows = window.segmentLocationHelpers.getLocationRowsByTypeForDataset(location, "municipio", datasetToUse);
      } else {
        // For freguesias, get the freguesia rows
        locationRows = window.segmentLocationHelpers.getLocationRowsByTypeForDataset(location, "freguesia", datasetToUse);
      }
      
      // Skip if no data found for this location
      if (locationRows.length === 0) {
        console.log(`No education data for location: ${location}`);
        return;
      }
      
      // Determine total population for this location
      const totalRow = locationRows.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
      const totalRowF = locationRows.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
      const totalPopulation = (parseInt(totalRow["Total"]) || 0) + (parseInt(totalRowF["Total"]) || 0);
      
      // Skip if no population
      if (totalPopulation === 0) return;
      
      // Filter by age groups - allow multiple
      let filteredData = locationRows;
      if (!ageGroups.includes('all')) {
        filteredData = filteredData.filter(row => ageGroups.includes(row["Age Group"]));
      }
      
      // Filter by genders - allow multiple
      if (!genders.includes('all')) {
        filteredData = filteredData.filter(row => genders.includes(row["Gender"]));
      } else {
        // If "all genders", we need both H and M
        filteredData = filteredData.filter(row => row["Gender"] === "H" || row["Gender"] === "M");
      }
      
      // Skip if no data matches the filters
      if (filteredData.length === 0) return;
      
      // Calculate segment value
      let segmentValue = 0;

      // Check if we're looking at age groups or total
      if (!ageGroups.includes('all')) {
        // For specific age groups, calculate across all selected values
        filteredData.forEach(row => {
          if (educationLevels.includes('all')) {
            // Sum all education levels
            const allEducationLevels = [
              "Nenhum", 
              "Ensino básico", 
              "Ensino secundário", 
              "Ensino pós-secundário", 
              "Ensino superior"
            ];
            allEducationLevels.forEach(level => {
              segmentValue += parseInt(row[level]) || 0;
            });
          } else {
            // Sum all selected education levels
            educationLevels.forEach(level => {
              segmentValue += parseInt(row[level]) || 0;
            });
          }
        });
      } else {
        // For "all age groups", use only Total rows to avoid double counting
        const totalRows = filteredData.filter(row => row["Age Group"] === "Total");
        
        totalRows.forEach(row => {
          if (educationLevels.includes('all')) {
            // Sum all education levels
            const allEducationLevels = [
              "Nenhum", 
              "Ensino básico", 
              "Ensino secundário", 
              "Ensino pós-secundário", 
              "Ensino superior"
            ];
            allEducationLevels.forEach(level => {
              segmentValue += parseInt(row[level]) || 0;
            });
          } else {
            // Sum all selected education levels
            educationLevels.forEach(level => {
              segmentValue += parseInt(row[level]) || 0;
            });
          }
        });
      }
      
      // Skip if no segment value
      if (segmentValue === 0) return;
      
      // Calculate percentage
      const percentage = totalPopulation > 0 ? (segmentValue / totalPopulation) * 100 : 0;
      
      // Add to location data
      locationData.push({
        location: location,
        value: displayMode === "percentage" ? percentage : segmentValue
      });
    });
  }
  
  // Sort by value (descending)
  locationData.sort((a, b) => b.value - a.value);
  
  // Take top 10 for readability
  const topData = locationData.slice(0, 10);
  
  // Update chart
  segmentDistributionChart.data.labels = topData.map(item => item.location);
  segmentDistributionChart.data.datasets[0].data = topData.map(item => item.value);
  
  // Update y-axis title based on display mode
  segmentDistributionChart.options.scales.y.title.text = 
    displayMode === "percentage" ? "Percentage (%)" : "Number of People";
  
  // Update dataset label
  segmentDistributionChart.data.datasets[0].label = 
    displayMode === "percentage" ? "Percentage" : "Population";
  
  // Update chart title based on view mode if applicable
  if (locationType === "region" || isRegionContext) {
    const chartTitle = regionViewMode === "municipality" 
      ? "Distribution by Municipality" 
      : "Distribution by Freguesia";
    segmentDistributionChart.options.plugins.title = {
      display: true,
      text: chartTitle
    };
  } else {
    // Hide title for normal views
    segmentDistributionChart.options.plugins.title = {
      display: false
    };
  }

  segmentDistributionChart.update();
  
  // Update filter summary
  updateFilterSummary();
}

/**
 * Update the filter summary display
 */
function updateFilterSummary() {
  if ($("#nationality-dataset-btn").hasClass("active")) {
    const nationalities = $("#nationality-select").val() || ['all'];
    const ageGroups = $("#age-group-select").val() || ['all'];
    const genders = $("#gender-select").val() || ['all'];
    
    let summaryHTML = '<strong>Selected filters:</strong> ';
    
    // Add nationality summary
    if (nationalities.includes('all')) {
      summaryHTML += '<span>All Nationalities</span> ';
    } else {
      if (nationalities.length <= 3) {
        nationalities.forEach(nat => {
          summaryHTML += `<span>${nat}</span> `;
        });
      } else {
        summaryHTML += `<span>${nationalities.length} nationalities</span> `;
      }
    }
    
    // Add age group summary
    if (ageGroups.includes('all')) {
      summaryHTML += '<span>All Ages</span> ';
    } else {
      if (ageGroups.length <= 3) {
        ageGroups.forEach(age => {
          summaryHTML += `<span>${age}</span> `;
        });
      } else {
        summaryHTML += `<span>${ageGroups.length} age groups</span> `;
      }
    }
    
    // Add gender summary
    if (genders.includes('all')) {
      summaryHTML += '<span>All Genders</span>';
    } else {
      genders.forEach(gender => {
        summaryHTML += `<span>${gender === 'H' ? 'Male' : 'Female'}</span> `;
      });
    }
    
    $("#nationality-filter-summary").html(summaryHTML);
  } else {
    const educationLevels = $("#education-level-select").val() || ['all'];
    const ageGroups = $("#edu-age-group-select").val() || ['all'];
    const genders = $("#edu-gender-select").val() || ['all'];
    
    let summaryHTML = '<strong>Selected filters:</strong> ';
    
    // Add education level summary
    if (educationLevels.includes('all')) {
      summaryHTML += '<span>All Education Levels</span> ';
    } else {
      if (educationLevels.length <= 2) {
        educationLevels.forEach(level => {
          summaryHTML += `<span>${level}</span> `;
        });
      } else {
        summaryHTML += `<span>${educationLevels.length} education levels</span> `;
      }
    }
    
    // Add age group summary
    if (ageGroups.includes('all')) {
      summaryHTML += '<span>All Ages</span> ';
    } else {
      if (ageGroups.length <= 3) {
        ageGroups.forEach(age => {
          summaryHTML += `<span>${age}</span> `;
        });
      } else {
        summaryHTML += `<span>${ageGroups.length} age groups</span> `;
      }
    }
    
    // Add gender summary
    if (genders.includes('all')) {
      summaryHTML += '<span>All Genders</span>';
    } else {
      genders.forEach(gender => {
        summaryHTML += `<span>${gender === 'H' ? 'Male' : 'Female'}</span> `;
      });
    }
    
    $("#education-filter-summary").html(summaryHTML);
  }
}

// Export functions globally
window.segmentChartModule = {
  init: initSegmentChart,
  updateSegmentChart: updateSegmentChart
};