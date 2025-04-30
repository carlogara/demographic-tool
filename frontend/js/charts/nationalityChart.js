/**
 * File: js/charts/nationalityChart.js
 * Location: demographic-tool/frontend/js/charts/nationalityChart.js
 * Purpose:
 *   - Creates & updates the "Nationality Breakdown" chart (a stacked or grouped bar chart).
 *   - Adds toggle for Portugal 
 */

let nationalityChart = null;  // Global chart reference
let showPortugal = false;     // Toggle state for Portugal display
let originalNationalityData = []; // Store original data passed to function

/**
 * Sets up the Chart.js bar chart for nationality, using the <canvas id="nationalityChart">.
 * Called once from main.js, after CSV data is loaded.
 */
function initNationalityChart() {
  // Add toggle button for Portugal
  addPortugalToggle();
  
  const ctx = document.getElementById('nationalityChart').getContext('2d');
  nationalityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Male',
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: [],
          data: []
        },
        {
          label: 'Female',
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: [],
          data: []
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            afterTitle: function(context) {
              // Display the total in the tooltip
              const index = context[0].dataIndex;
              const male   = context[0].chart.data.datasets[0].data[index];
              const female = context[0].chart.data.datasets[1].data[index];
              return `Total: ${male + female}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: false,
          title: { display: true, text: 'Naturalidade' }
        },
        y: {
          stacked: false,
          beginAtZero: true,
          title: { display: true, text: 'Quantidade' }
        }
      },
      onClick: handleNationalityChartClick
    }
  });
}

/**
 * Adds toggle button for Portugal
 */
function addPortugalToggle() {
  const chartTitle = document.querySelector('.nationality-chart-title');
  if (!chartTitle) return;
  
  const toggleHTML = `
    <div class="portugal-toggle">
      <button id="toggle-portugal" class="portugal-toggle-btn">
        Incluir Portugal
      </button>
    </div>
  `;
  
  // Add button to the right of the title
  chartTitle.innerHTML = `<h2>Distribuição por País de Naturalidade</h2>${toggleHTML}`;
  
  // Add event listener after the DOM is updated
  setTimeout(() => {
    const toggleBtn = document.getElementById('toggle-portugal');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        showPortugal = !showPortugal;
        this.textContent = showPortugal ? 'Excluir Portugal' : 'Incluir Portugal';
        this.classList.toggle('active', showPortugal);
        
        // Update chart with original data but with updated toggle state
        if (originalNationalityData.length > 0) {
          updateChartDisplay(originalNationalityData);
        }
      });
    }
  }, 0);
}

/**
 * Main function called from outside to update the chart
 * @param {Array} nationalityData - e.g. [{ nationality, male, female, total }, ...]
 */
function updateNationalityChart(nationalityData) {
  if (!nationalityData || nationalityData.length === 0) return;
  
  // Store the original data
  originalNationalityData = [...nationalityData];
  
  // Call the display update function
  updateChartDisplay(nationalityData);
}

/**
 * Updates the main chart
 * @param {Array} nationalityData - Array of nationality objects
 */
function updateChartDisplay(nationalityData) {
  if (!nationalityData || nationalityData.length === 0) return;
  
  // Get Portugal data
  const portugalData = getPortugalData();
  
  // Prepare data for the main chart
  let displayData = [...nationalityData.filter(item => item.nationality !== 'Portuguesa')]; // Start with foreign data only
  
  // Add Portugal if toggle is on
  if (showPortugal && portugalData) {
    displayData = [portugalData, ...displayData];
  }
  
  // Sort by total population (descending)
  displayData.sort((a, b) => b.total - a.total);
  
  // Limit to top 10 for readability
  const topData = displayData.slice(0, 10);
  
  // Prepare arrays for chart
  const labels = topData.map(item => item.nationality);
  const maleData = topData.map(item => item.male);
  const femaleData = topData.map(item => item.female);
  
  // Update chart data
  nationalityChart.data.labels = labels;
  nationalityChart.data.datasets[0].data = maleData;
  nationalityChart.data.datasets[1].data = femaleData;
  
  // Each bar can have an individual border width
  nationalityChart.data.datasets[0].borderWidth = maleData.map(() => 1);
  nationalityChart.data.datasets[1].borderWidth = femaleData.map(() => 1);
  
  // Reset background colors
  nationalityChart.data.datasets[0].backgroundColor = maleData.map(() => 'rgba(54, 162, 235, 0.7)');
  nationalityChart.data.datasets[1].backgroundColor = femaleData.map(() => 'rgba(255, 99, 132, 0.7)');
  
  nationalityChart.update();
}

/**
 * Gets Portugal data from window.locationData
 * @returns {Object|null} - Portugal nationality data object or null if not found
 */
function getPortugalData() {
  if (!window.locationData) return null;
  
  const maleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
  const femaleRow = window.locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
  
  const portugalMale = parseInt(maleRow["Portuguesa"]) || 0;
  const portugalFemale = parseInt(femaleRow["Portuguesa"]) || 0;
  const portugalTotal = portugalMale + portugalFemale;
  
  if (portugalTotal > 0) {
    return {
      nationality: 'Portuguesa',
      male: portugalMale,
      female: portugalFemale,
      total: portugalTotal
    };
  }
  
  return null;
}

/**
 * Handles clicks on the nationality chart
 */
function handleNationalityChartClick(event, elements) {
  if (elements.length > 0) {
    const index = elements[0].index;
    const nationality = nationalityChart.data.labels[index];

    // Reset any previous selection styling
    nationalityChart.data.datasets.forEach(dataset => {
      // Because backgroundColor can be an array or single value,
      // we ensure we reset each bar to the "default" color
      if (dataset.label === 'Male') {
        dataset.backgroundColor = dataset.backgroundColor.map(() => 'rgba(54, 162, 235, 0.7)');
      } else {
        dataset.backgroundColor = dataset.backgroundColor.map(() => 'rgba(255, 99, 132, 0.7)');
      }
      dataset.borderWidth = dataset.borderWidth.map(() => 1);
    });

    // Highlight the selected bars
    nationalityChart.data.datasets.forEach(dataset => {
      if (dataset.label === 'Male') {
        dataset.backgroundColor[index] = 'rgba(54, 162, 235, 1)';
        dataset.borderWidth[index] = 2;
      } else {
        dataset.backgroundColor[index] = 'rgba(255, 99, 132, 1)';
        dataset.borderWidth[index] = 2;
      }
    });
    nationalityChart.update();

    // Show age distribution for the clicked nationality
    window.selectedNationality = nationality;
    $("#selected-nationality").text(nationality);

    // Use the current selectedGender (defined in ageDistributionChart.js) or default
    updateAgeDistribution(nationality, window.selectedGender || "H");
    $("#age-distribution-section").show();
  }
}