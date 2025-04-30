/**
 * File: disabilityChart.js
 * Location: demographic-tool/frontend/js/charts/disabilityChart.js
 * Purpose:
 *   - Creates and updates the disability visualization chart
 *   - Handles gender and age group filtering
 *   - Calculates percentages for stacked bars
 */

// Global chart reference
let disabilityChart = null;
let chartInitialized = false;

// Current filter state
let currentDisabilityFilters = {
  gender: 'total', // 'total', 'H', or 'M'
  ageGroup: 'all'  // 'all' or specific age group
};

/**
 * Initialize the disability chart
 */
function initDisabilityChart() {
  // Create the chart container and filters if they don't exist
  setupChartContainer();
  
  // Create the chart
  createDisabilityChart();
  
  // Set up event listeners for filters
  setupFilterEventListeners();
  
  // Don't populate age buttons here, it will be done when needed

  // Mark as initialized
  chartInitialized = true;
}

/**
 * Sets up the chart container structure
 */
function setupChartContainer() {
  const container = document.getElementById('disability-chart-section');
  if (!container) {
    console.warn("Disability chart container not found");
    return;
  }
  
  // Only proceed if the container is empty or doesn't have the chart
  if (container.querySelector('#disabilityChart')) {
    return;
  }
  
  // Create the structure with filters and chart - with unique class names
  // Removed the instructions text at the bottom
  container.innerHTML = `
    <h2>Dificuldades em <span id="disability-location-name">-</span></h2>
    <div class="disability-filters">
      <div class="filter-section">
        <div class="filter-section-title">Sexo</div>
        <div class="disability-gender-toggle">
          <button class="disability-gender-btn active" data-value="total">Todos</button>
          <button class="disability-gender-btn" data-value="H">Homens</button>
          <button class="disability-gender-btn" data-value="M">Mulheres</button>
        </div>
      </div>
      <div class="filter-section">
        <div class="filter-section-title">Grupo Etário</div>
        <div class="disability-age-buttons" id="disability-age-group-buttons">
          <button class="disability-age-btn all-btn active" data-value="all">Todas as Idades</button>
          <!-- Age groups will be populated dynamically -->
        </div>
      </div>
    </div>
    <div class="chart-container">
      <canvas id="disabilityChart"></canvas>
    </div>
  `;
}

/**
 * Creates the disability chart with initial data
 */
function createDisabilityChart() {
  const ctx = document.getElementById('disabilityChart');
  if (!ctx) {
    console.warn("Disability chart canvas not found");
    return;
  }
  
  // Default data structure (will be populated with real data later)
  const data = {
    labels: ['Ver', 'Ouvir', 'Andar ou subir degraus', 'Memória ou concentração', 'Compreender os outros ou fazer-se compreender'],
    datasets: [
      {
        label: 'Tem alguma dificuldade',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(173, 216, 230, 0.8)', // Light blue
        borderColor: 'rgba(173, 216, 230, 1)',
        borderWidth: 1
      },
      {
        label: 'Tem muita dificuldade',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(65, 105, 225, 0.8)', // Medium blue
        borderColor: 'rgba(65, 105, 225, 1)',
        borderWidth: 1
      },
      {
        label: 'Não consegue efetuar a ação',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(0, 0, 139, 0.8)', // Dark blue
        borderColor: 'rgba(0, 0, 139, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Create the stacked bar chart with simplified options
  disabilityChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false // Hide vertical grid lines
          }
        },
        y: {
          stacked: true,
          beginAtZero: true, // Always start at zero
          grid: {
            color: 'rgba(0, 0, 0, 0.1)' // Lighter grid lines
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
            },
            footer: function(tooltipItems) {
              // Calculate total for this disability type
              let total = 0;
              tooltipItems.forEach(item => {
                total += item.parsed.y;
              });
              return 'Total: ' + total.toFixed(1) + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Set up event listeners for filter buttons
 */
function setupFilterEventListeners() {
  // Gender toggle buttons - use class-specific selectors
  document.querySelectorAll('.disability-gender-toggle .disability-gender-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.disability-gender-toggle .disability-gender-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update filter state
      currentDisabilityFilters.gender = this.dataset.value;
      
      // Update chart
      updateDisabilityChart();
    });
  });
  
  // Age group buttons - using event delegation with specific class selectors
  const ageButtonsContainer = document.getElementById('disability-age-group-buttons');
  if (ageButtonsContainer) {
    ageButtonsContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('disability-age-btn')) {
        // Remove active class from all buttons in this container
        this.querySelectorAll('.disability-age-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        e.target.classList.add('active');
        
        // Update filter state
        currentDisabilityFilters.ageGroup = e.target.dataset.value;
        
        // Update chart
        updateDisabilityChart();
      }
    });
  }
}

/**
 * Populate age group buttons based on available data
 */
function populateAgeGroupButtons() {
  try {
    const container = document.getElementById('disability-age-group-buttons');
    if (!container) return;
    
    // Default age groups to use if data handler isn't available
    let ageGroups = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", 
                     "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", 
                     "65-69", "70-74", "75-79", "80-84", "85+"];
    
    // If the data handler is available, use it to get age groups
    if (window.disabilityDataHandler && typeof window.disabilityDataHandler.getAgeGroups === 'function') {
      const handlerGroups = window.disabilityDataHandler.getAgeGroups();
      if (handlerGroups && handlerGroups.length > 0) {
        ageGroups = handlerGroups;
      }
    }
    
    // Clear container first but preserve the "All ages" button
    if (container.childElementCount <= 1) {
      container.innerHTML = '<button class="disability-age-btn all-btn active" data-value="all">Todas as Idades</button>';
    
      // Add buttons for each age group
      ageGroups.forEach(age => {
        const button = document.createElement('button');
        button.className = 'disability-age-btn';
        button.dataset.value = age;
        button.textContent = age;
        container.appendChild(button);
      });
    }
  } catch (error) {
    console.error("Error populating age group buttons:", error);
  }
}

/**
 * Update the chart data based on current filters
 */
function updateDisabilityChart() {
  if (!disabilityChart) {
    console.warn("Disability chart not initialized yet");
    return;
  }
  
  // Get the current location
  const location = document.getElementById('current-location-name')?.textContent;
  if (!location) return;
  
  // Try to use the disability data handler if available
  if (!window.disabilityDataHandler || typeof window.disabilityDataHandler.calculateData !== 'function') {
    console.warn("Disability data handler not available");
    return;
  }
  
  // Get the location type to handle freguesias properly
  const locationType = getLocationType(location);
  
  // Determine which location to use for data
  let dataLocation = location;
  
  // For freguesias, use the parent município
  if (locationType === "freguesia" && window.locationData) {
    const sampleRow = window.locationData.find(row => row["Place of Residence"] === location);
    if (sampleRow && sampleRow.municipio) {
      dataLocation = sampleRow.municipio;
    }
  }
  
  // Update the location name in the disability section title - always show the município name
  const locationNameElement = document.getElementById('disability-location-name');
  if (locationNameElement) {
    // Show only the município name regardless of whether we're in a freguesia
    locationNameElement.textContent = dataLocation;
  }
  
  // Calculate data based on current filters and appropriate location
  const chartData = window.disabilityDataHandler.calculateData(
    dataLocation,
    currentDisabilityFilters.gender,
    currentDisabilityFilters.ageGroup
  );
  
  // Update chart data - using original type names, not shortened versions
  disabilityChart.data.labels = chartData.types;
  disabilityChart.data.datasets[0].data = chartData.somePercentages;
  disabilityChart.data.datasets[1].data = chartData.alotPercentages;
  disabilityChart.data.datasets[2].data = chartData.cannotPercentages;
  
  // Let Chart.js handle the Y-axis scaling automatically
  disabilityChart.options.scales.y.max = undefined;
  
  // Update the chart
  disabilityChart.update();
  
  // Update button states to reflect current filter
  updateFilterButtonStates();
}

/**
 * Updates the button states to match current filter settings
 */
function updateFilterButtonStates() {
  // Update gender buttons - use specific class selectors
  document.querySelectorAll('.disability-gender-toggle .disability-gender-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === currentDisabilityFilters.gender);
  });
  
  // Update age group buttons - use specific class selectors
  const ageButtons = document.querySelectorAll('#disability-age-group-buttons .disability-age-btn');
  ageButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === currentDisabilityFilters.ageGroup);
  });
}

/**
 * Update the chart when the location changes
 * @param {string} location - The new location
 */
function updateDisabilityChartForLocation(location) {
  // Make sure age groups are populated
  populateAgeGroupButtons();
  
  // Reset filters to defaults
  currentDisabilityFilters = {
    gender: 'total',
    ageGroup: 'all'
  };
  
  // Reset button visual states
  resetButtonVisualStates();
  
  // Update the chart
  updateDisabilityChart();
}

/**
 * Reset all filter buttons to their default visual states
 */
function resetButtonVisualStates() {
  // Reset gender buttons
  document.querySelectorAll('.disability-gender-toggle .disability-gender-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.value === 'total') {
      btn.classList.add('active');
    }
  });
  
  // Reset age group buttons
  document.querySelectorAll('#disability-age-group-buttons .disability-age-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.classList.contains('all-btn')) {
      btn.classList.add('active');
    }
  });
}

/**
 * Force update the chart data immediately
 * Called directly from dataHandler.js when a location is selected
 */
function forceUpdateDisabilityChart() {
  // If chart isn't initialized yet, initialize it first
  if (!chartInitialized) {
    initDisabilityChart();
  }
  
  // Make sure age groups are populated
  populateAgeGroupButtons();
  
  // Reset filters to defaults
  currentDisabilityFilters = {
    gender: 'total',
    ageGroup: 'all'
  };
  
  // Update button visual states
  resetButtonVisualStates();
  
  // Update the chart
  updateDisabilityChart();
}

// Export functions for use by other modules
window.disabilityChartModule = {
  init: initDisabilityChart,
  updateForLocation: updateDisabilityChartForLocation,
  populateAgeGroupButtons: populateAgeGroupButtons,
  forceUpdate: forceUpdateDisabilityChart  // Force update method
};