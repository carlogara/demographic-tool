/**
 * File: ageDistributionChart.js
 * Location: demographic-tool/frontend/js/charts/ageDistributionChart.js
 * Purpose:
 *   - Creates & updates the Age Distribution bar chart in #ageDistributionChart.
 *   - Handles your gender button clicks (#male-age-btn, #female-age-btn, #total-age-btn).
 * Meta Info:
 *   - "selectedGender" is stored in window.selectedGender so multiple modules can see it.
 *   - Depends on locationData (set in dataHandler.js).
 */

let ageDistributionChart = null;  // Global chart reference
window.selectedGender = "H";      // Default selected gender is "H" (male in your data)

function initAgeDistributionChart() {
  // Initialize the chart once
  const ageCtx = document.getElementById('ageDistributionChart').getContext('2d');
  ageDistributionChart = new Chart(ageCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: "Population",
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Count' }
        },
        x: {
          title: { display: true, text: 'Age Groups' }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = total ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Wire up the 3 gender buttons
  $("#male-age-btn, #female-age-btn").on("click", function() {
    $(".gender-btn").removeClass("active");
    $(this).addClass("active");
    window.selectedGender = (this.id === "male-age-btn") ? "H" : "M";
    updateAgeDistribution(window.selectedNationality, window.selectedGender);
  });

  $("#total-age-btn").on("click", function() {
    $(".gender-btn").removeClass("active");
    $(this).addClass("active");
    window.selectedGender = "T"; // "T" means "Total"
    updateAgeDistribution(window.selectedNationality, window.selectedGender);
  });
}

/**
 * Called whenever a nationality is clicked in the nationality chart,
 * or when the user changes the gender button.
 * @param {string} nationality - e.g. "Brasil", "Angola", etc.
 * @param {string} gender - "H" (male), "M" (female), or "T" (total).
 */
function updateAgeDistribution(nationality, gender) {
  if (!nationality || !window.locationData) return;
  if (!ageDistributionChart) return;

  // For "T" (total), we sum up all genders in the age data
  if (gender === "T") {
    const ageDataAll = window.locationData.filter(row => row["Age Group"] !== "Total");
    const ageGroupTotals = {};
    ageDataAll.forEach(row => {
      const ageGroup = row["Age Group"];
      const count = parseInt(row[nationality]) || 0;
      ageGroupTotals[ageGroup] = (ageGroupTotals[ageGroup] || 0) + count;
    });
    const ageGroups = Object.keys(ageGroupTotals);
    const ageCounts = ageGroups.map(ag => ageGroupTotals[ag]);

    ageDistributionChart.data.labels = ageGroups;
    ageDistributionChart.data.datasets[0].data = ageCounts;
  } else {
    // "H" or "M"
    const ageData = window.locationData.filter(row => 
      row["Age Group"] !== "Total" && row["Gender"] === gender
    );

    const ageGroups = [];
    const ageCounts = [];

    ageData.forEach(row => {
      const ageGroup = row["Age Group"];
      const count = parseInt(row[nationality]) || 0;
      if (count > 0) {
        ageGroups.push(ageGroup);
        ageCounts.push(count);
      }
    });

    ageDistributionChart.data.labels = ageGroups;
    ageDistributionChart.data.datasets[0].data = ageCounts;
  }
  
  ageDistributionChart.update();
}