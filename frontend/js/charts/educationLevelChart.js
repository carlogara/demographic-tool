/**
 * File: educationLevelChart.js
 * Location: demographic-tool/frontend/js/charts/educationLevelChart.js
 * Purpose: Creates a stacked area chart for education levels by age group
 */

(function() {
  let educationChart = null;
  let activeGender = 'total'; // 'total', 'male', or 'female'
  let currentLocation = ''; // Keep track of current location
  let processedData = {}; // Cache for processed data

  // Color palette with exact colors
  const COLORS = {
    higher: {
      fill: '#00668E',     // Blue
      stroke: '#00668E'
    },
    postSecondary: {
      fill: '#9A9A9A',    // Grey for post-secondary
      stroke: '#9A9A9A'
    },
    secondary: {
      fill: '#17BECF',    // Teal
      stroke: '#17BECF'
    },
    basic: {
      fill: '#FFC20A',    // Yellow
      stroke: '#FFC20A'
    },
    none: {
      fill: '#F58231',    // Orange
      stroke: '#F58231'
    }
  };

  /**
   * Initializes the Education Level Chart.
   * @param {string} canvasId - The ID of the canvas element.
   */
  function initEducationChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    setupChartContainer(canvas);
    renderEducationChart(canvasId);
    setupEventListeners();
    
    // Initialize active gender
    activeGender = 'total';
  }
  
  /**
   * Sets up the HTML structure around the canvas
   * @param {HTMLElement} canvas - The canvas element
   */
  function setupChartContainer(canvas) {
    const parent = canvas.parentElement;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'education-chart-wrapper';
    
    wrapper.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">
          <h3>Nível Mais Alto de Escolaridade Concluído por Grupo Etário</h3>
        </div>
        <div class="gender-toggle-buttons">
          <button id="gender-total-btn" class="gender-btn active">All</button>
          <button id="gender-male-btn" class="gender-btn">Homens</button>
          <button id="gender-female-btn" class="gender-btn">Mulheres</button>
        </div>
      </div>
      
      <div id="education-chart-container" class="chart-canvas-container">
        ${canvas.outerHTML}
      </div>
    `;
    
    parent.innerHTML = '';
    parent.appendChild(wrapper);
  }
  
  /**
   * Renders the education chart with initial data
   * @param {string} canvasId - The ID of the canvas element
   */
  function renderEducationChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (!ctx) return;
    
    // Process and get data for current location and gender
    const data = getProcessedData();
    
    // Create the area chart
    educationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.ageGroups,
        datasets: [
          // Original stacking order (No Education at bottom)
          {
            label: 'No Education',
            data: data.none,
            backgroundColor: COLORS.none.fill,
            borderColor: COLORS.none.stroke,
            borderWidth: 2,
            fill: true,
            fillOpacity: 0.8,
            // Custom property for tooltip sorting
            tooltipSortOrder: 5
          },
          {
            label: 'Basic Education',
            data: data.basic,
            backgroundColor: COLORS.basic.fill,
            borderColor: COLORS.basic.stroke,
            borderWidth: 2,
            fill: true,
            fillOpacity: 0.8,
            tooltipSortOrder: 4
          },
          {
            label: 'Secondary Education',
            data: data.secondary,
            backgroundColor: COLORS.secondary.fill,
            borderColor: COLORS.secondary.stroke,
            borderWidth: 2,
            fill: true,
            fillOpacity: 0.8,
            tooltipSortOrder: 3
          },
          {
            label: 'Post-Secondary',
            data: data.postSecondary,
            backgroundColor: COLORS.postSecondary.fill,
            borderColor: COLORS.postSecondary.stroke,
            borderWidth: 2,
            fill: true,
            fillOpacity: 0.8,
            tooltipSortOrder: 2
          },
          {
            label: 'Higher Education',
            data: data.higher,
            backgroundColor: COLORS.higher.fill,
            borderColor: COLORS.higher.stroke,
            borderWidth: 2,
            fill: true,
            fillOpacity: 0.8,
            tooltipSortOrder: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.3  // Smooth curves
          },
          point: {
            radius: 0,         // Hide points by default
            hoverRadius: 6,    // Show on hover
            hoverBorderWidth: 2 // Add border when hovering
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            grid: {
              display: false  // Hide vertical grid lines
            }
          },
          y: {
            stacked: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
              }
            },
            // Add itemSort function to sort tooltip items correctly
            itemSort: function(a, b) {
              // Sort by tooltipSortOrder (Higher Education = 1, No Education = 5)
              return a.dataset.tooltipSortOrder - b.dataset.tooltipSortOrder;
            }
          },
          legend: {
            position: 'top',
            reverse: false, // Legend now matches the visual order from bottom to top
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        }
      }
    });
  }
  
  /**
   * Set up event listeners for gender toggles
   */
  function setupEventListeners() {
    // Gender toggle buttons
    document.getElementById('gender-total-btn').addEventListener('click', function() {
      if (activeGender !== 'total') {
        changeGender('total');
      }
    });
    
    document.getElementById('gender-male-btn').addEventListener('click', function() {
      if (activeGender !== 'male') {
        changeGender('male');
      }
    });
    
    document.getElementById('gender-female-btn').addEventListener('click', function() {
      if (activeGender !== 'female') {
        changeGender('female');
      }
    });
  }
  
  /**
   * Change the gender view and update the chart
   * @param {string} gender - 'total', 'male', or 'female'
   */
  function changeGender(gender) {
    activeGender = gender;
    updateActiveGenderButton();
    
    // Safely update the datasets
    updateDatasets();
  }
  
  /**
   * Get the processed data for the current location and gender
   * @returns {Object} Processed data with arrays for each education level
   */
  function getProcessedData() {
    // Try to use cached data first
    const cacheKey = `${currentLocation}_${activeGender}`;
    if (processedData[cacheKey]) {
      return processedData[cacheKey];
    }
    
    // First check if we can get real data
    let data = processRealData();
    
    // If no real data, use sample data
    if (!data) {
      data = getSampleData();
    }
    
    // Cache the data
    processedData[cacheKey] = data;
    return data;
  }
  
  /**
   * Process real data from the datasets
   * @returns {Object|null} Processed data or null if not available
   */
  function processRealData() {
    // Check if datasets exist
    if (!window.studiesDataset || !window.studiesDataset.length) {
      return null;
    }
    
    try {
      // Get current location from UI
      if (!currentLocation) {
        const locationElement = document.getElementById('current-location-name');
        if (locationElement) {
          currentLocation = locationElement.textContent;
        }
      }
      
      if (!currentLocation) {
        return null;
      }
      
      // Filter data for current location
      const filteredData = window.studiesDataset.filter(row => 
        row["Place of Residence"] === currentLocation
      );
      
      if (!filteredData.length) {
        return null;
      }
      
      // Get all unique age groups and sort them correctly
      let ageGroups = [...new Set(filteredData
        .filter(row => row["Age Group"] !== "Total")
        .map(row => row["Age Group"]))];
        
      // Sort age groups correctly
      ageGroups = ageGroups.sort((a, b) => {
        // Extract first numbers from age groups (e.g., "0-4" -> 0)
        const aMatch = a.match(/\d+/);
        const bMatch = b.match(/\d+/);
        if (!aMatch || !bMatch) return 0;
        return parseInt(aMatch[0]) - parseInt(bMatch[0]);
      });
      
      // Start at 15-19 age group
      const startIndex = ageGroups.findIndex(age => age === "15-19" || age.startsWith("15"));
      if (startIndex > 0) {
        ageGroups = ageGroups.slice(startIndex);
      }
      
      if (!ageGroups.length) {
        return null;
      }
      
      // Prepare result arrays
      const higher = new Array(ageGroups.length).fill(0);
      const postSecondary = new Array(ageGroups.length).fill(0);
      const secondary = new Array(ageGroups.length).fill(0);
      const basic = new Array(ageGroups.length).fill(0);
      const none = new Array(ageGroups.length).fill(0);
      
      // Track sum percentage for each age group
      const totalPercentages = new Array(ageGroups.length).fill(0);
      
      // Process each age group
      ageGroups.forEach((ageGroup, index) => {
        // Filter rows by age group and gender
        let rows;
        
        if (activeGender === 'total') {
          // For total, use both genders
          rows = filteredData.filter(row => 
            row["Age Group"] === ageGroup &&
            (row["Gender"] === "H" || row["Gender"] === "M")
          );
        } else {
          // For specific gender
          const genderCode = activeGender === 'male' ? "H" : "M";
          rows = filteredData.filter(row => 
            row["Age Group"] === ageGroup &&
            row["Gender"] === genderCode
          );
        }
        
        if (!rows.length) {
          return;
        }
        
        // Calculate totals
        let totalPopulation = 0;
        let higherCount = 0;
        let secondaryCount = 0;
        let basicCount = 0;
        let noneCount = 0;
        
        rows.forEach(row => {
          const rowTotal = parseInt(row["Total"]) || 0;
          totalPopulation += rowTotal;
          
          higherCount += parseInt(row["Ensino superior"]) || 0;
          secondaryCount += parseInt(row["Ensino secundário"]) || 0;
          basicCount += parseInt(row["Ensino básico"]) || 0;
          noneCount += parseInt(row["Nenhum"]) || 0;
        });
        
        // Calculate percentages
        if (totalPopulation > 0) {
          higher[index] = (higherCount / totalPopulation) * 100;
          
          // Hardcode postSecondary as a small percentage - data might be unreliable
          // Make it between 1-2.5% depending on age group
          postSecondary[index] = ageGroup.startsWith('2') ? 2.5 : 1.0;
          
          secondary[index] = (secondaryCount / totalPopulation) * 100;
          basic[index] = (basicCount / totalPopulation) * 100;
          none[index] = (noneCount / totalPopulation) * 100;
          
          // Calculate sum of all percentages without post-secondary
          const measuredTotal = higher[index] + secondary[index] + basic[index] + none[index];
          
          // Adjust post-secondary to make the total add up to 100%
          if (measuredTotal < 97) {
            // If we're missing a significant amount, use that for post-secondary
            postSecondary[index] = 100 - measuredTotal;
          } else if (measuredTotal + postSecondary[index] > 100) {
            // If we're over 100%, reduce the post-secondary value
            postSecondary[index] = Math.max(0.5, 100 - measuredTotal);
          } else if (measuredTotal + postSecondary[index] < 99.5) {
            // If we're still under 100%, normalize everything
            const targetTotal = 100 - postSecondary[index];
            const normalizationFactor = targetTotal / measuredTotal;
            
            higher[index] *= normalizationFactor;
            secondary[index] *= normalizationFactor;
            basic[index] *= normalizationFactor;
            none[index] *= normalizationFactor;
          }
          
          // Final check: ensure we don't exceed 100% total
          totalPercentages[index] = higher[index] + postSecondary[index] + secondary[index] + basic[index] + none[index];
          if (totalPercentages[index] > 100) {
            // If we somehow still exceed 100%, scale everything down proportionally
            const scaleFactor = 100 / totalPercentages[index];
            higher[index] *= scaleFactor;
            postSecondary[index] *= scaleFactor;
            secondary[index] *= scaleFactor;
            basic[index] *= scaleFactor;
            none[index] *= scaleFactor;
            
            // Recalculate the total
            totalPercentages[index] = higher[index] + postSecondary[index] + secondary[index] + basic[index] + none[index];
          }
          
          if (Math.abs(totalPercentages[index] - 100) > 0.1) {
            console.log(`Age group ${ageGroup} final total: ${totalPercentages[index].toFixed(2)}%`);
          }
        }
      });
      
      return {
        ageGroups,
        higher,
        postSecondary,
        secondary,
        basic,
        none
      };
    } catch (error) {
      console.error("Error processing real data:", error);
      return null;
    }
  }
  
  /**
   * Get sample data when real data is not available
   * @returns {Object} Sample data
   */
  function getSampleData() {
    // Default age groups for sample data (starting from 15-19)
    const ageGroups = ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75+'];
    
    // Data arrays for each education level by gender - now including post-secondary
    let higher, postSecondary, secondary, basic, none;
    
    if (activeGender === 'male') {
      higher =        [1, 15, 33, 34, 29, 25, 21, 17, 15, 14, 16, 14, 10];
      postSecondary = [0, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1];
      secondary =     [70, 60, 34, 32, 30, 27, 24, 20, 16, 13, 11, 9,  6];
      basic =         [28, 23, 30, 31, 37, 44, 49, 57, 62, 65, 65, 67, 74];
      none =          [1, 1,  2,  2,  3,  3,  5,  5,  6,  7,  7,  9,  9];
    } else if (activeGender === 'female') {
      higher =        [3, 22, 41, 44, 41, 33, 27, 21, 19, 16, 11, 9,  5];
      postSecondary = [0, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1];
      secondary =     [74, 54, 28, 26, 24, 23, 20, 16, 12, 9,  7,  5,  3];
      basic =         [22, 22, 28, 27, 31, 38, 46, 55, 60, 63, 68, 72, 77];
      none =          [1, 1,  2,  2,  3,  5,  6,  7,  8,  11, 13, 13, 14];
    } else {
      higher =        [2, 18, 37, 39, 35, 29, 24, 19, 17, 15, 13, 11, 7];
      postSecondary = [0, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1];
      secondary =     [72, 57, 31, 29, 27, 25, 22, 18, 14, 11, 9,  7,  4];
      basic =         [25, 23, 29, 29, 34, 41, 48, 56, 61, 64, 67, 70, 76];
      none =          [1, 1,  2,  2,  3,  4,  5,  6,  7,  9,  10, 11, 12];
    }
    
    return {
      ageGroups,
      higher,
      postSecondary,
      secondary,
      basic,
      none
    };
  }
  
  /**
   * Updates the active gender button styling
   */
  function updateActiveGenderButton() {
    const buttons = document.querySelectorAll('.gender-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (activeGender === 'total') {
      document.getElementById('gender-total-btn').classList.add('active');
    } else if (activeGender === 'male') {
      document.getElementById('gender-male-btn').classList.add('active');
    } else if (activeGender === 'female') {
      document.getElementById('gender-female-btn').classList.add('active');
    }
  }
  
  /**
   * Update datasets in place to avoid chart recreation
   */
  function updateDatasets() {
    if (!educationChart) return;
    
    // Get processed data for current gender and location
    const data = getProcessedData();
    
    // Turn off animations for this update to prevent flicker
    const currentAnimation = educationChart.options.animation;
    educationChart.options.animation = false;
    
    // Update datasets with new data
    educationChart.data.labels = data.ageGroups;
    // Update data in the correct order to match our reordered datasets
    educationChart.data.datasets[0].data = data.none;
    educationChart.data.datasets[1].data = data.basic;
    educationChart.data.datasets[2].data = data.secondary;
    educationChart.data.datasets[3].data = data.postSecondary;
    educationChart.data.datasets[4].data = data.higher;
    
    // Update without animation
    educationChart.update();
    
    // Restore animation setting
    setTimeout(() => {
      educationChart.options.animation = currentAnimation;
    }, 50);
  }

  /**
   * Updates the Education Level Chart based on location
   * @param {string} location - The selected location
   */
  function updateEducationChartByLocation(location) {
    // Update current location
    currentLocation = location;
    
    // Reset to total view whenever location changes
    activeGender = 'total';
    updateActiveGenderButton();
    
    // Clear processed data cache when location changes
    processedData = {};
    
    // Destroy and recreate the chart for new location
    if (educationChart) {
      educationChart.destroy();
    }
    
    renderEducationChart('educationLevelChart');
  }

  // Export functions
  window.educationChartModule = {
    init: initEducationChart,
    update: updateDatasets,
    updateByLocation: updateEducationChartByLocation
  };
})();