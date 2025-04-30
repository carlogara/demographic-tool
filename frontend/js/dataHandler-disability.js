/**
 * File: dataHandler-disability.js
 * Location: demographic-tool/frontend/js/dataHandler-disability.js
 * Purpose:
 *   - Loads CSV files with disability data
 *   - Processes and merges disability data rows
 *   - Provides functions to filter and calculate percentages
 */

// Global dataset for disabilities
window.disabilityDataset = [];

/**
 * Loads disability data from the CSV files
 * @returns {Promise} Promise that resolves when all data is loaded
 */
async function loadDisabilityData() {
  try {
    // Regular data from data_cleaned_disabilities
    const dataFolder = "../data_cleaned_dificuldades/";
    const urls = [
      dataFolder + 'grande_lisboa_dificuldades_clean.csv'
    ];
    
    // Region data from regions/disabilities folder
    const regionDataFolder = "../regions/dificuldades/";
    const regionUrls = [
      regionDataFolder + 'just_region_grand_lisboa_dificuldades_clean.csv'
    ];
    
    // Combine all URLs
    const allUrls = [...urls, ...regionUrls];
    let allData = [];
    
    // Load all files
    for (let url of allUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to load ${url}, skipping.`);
          continue;
        }
        
        const data = await response.text();
        if (!data) {
          console.warn(`Empty CSV file: ${url}, skipping.`);
          continue;
        }
        
        // Try the same parser as other data
        console.log(`Processing disability file: ${url}`);
        const csvData = simpleParseCsv(data);
        
        if (csvData.length === 0) {
          console.warn(`Invalid or empty parsed data for file: ${url}, skipping.`);
          continue;
        }
        
        allData = allData.concat(csvData);
        console.log(`Loaded ${csvData.length} rows from ${url} (disabilities)`);
      } catch (error) {
        console.warn(`Error processing ${url}: ${error.message}`);
      }
    }
    
    window.disabilityDataset = allData;
    console.log(`Total disability dataset size: ${window.disabilityDataset.length} rows`);
  } catch (error) {
    console.error("Error loading disability CSV:", error);
  }
}

/**
 * Filter disability data for a specific location
 * @param {string} location - The location name to filter by
 * @returns {Array} Filtered disability data
 */
function getDisabilityDataForLocation(location) {
  if (!window.disabilityDataset || !window.disabilityDataset.length) {
    console.warn("Disability dataset not loaded");
    return [];
  }
  
  // Filter by location
  return window.disabilityDataset.filter(row => row["Place of Residence"] === location);
}

/**
 * Get all available age groups from disability data
 * @returns {Array} Array of unique age groups
 */
function getDisabilityAgeGroups() {
  if (!window.disabilityDataset || !window.disabilityDataset.length) return [];
  
  // Get all unique age groups excluding "Total"
  const ageGroups = [...new Set(window.disabilityDataset
    .filter(row => row["Age Group"] !== "Total")
    .map(row => row["Age Group"]))];
  
  // Sort age groups
  return ageGroups.sort((a, b) => {
    // Extract first number from age group
    const aNum = parseInt(a.match(/\d+/)?.[0] || "0");
    const bNum = parseInt(b.match(/\d+/)?.[0] || "0");
    return aNum - bNum;
  });
}

/**
 * Get all disability types from the dataset
 * @returns {Array} Array of unique disability types
 */
function getDisabilityTypes() {
  if (!window.disabilityDataset || !window.disabilityDataset.length) return [];
  
  // Get all unique disability types
  return [...new Set(window.disabilityDataset.map(row => row["Tipo de dificuldade"]))];
}

/**
 * Calculate disability percentages for charting
 * @param {string} location - The location name
 * @param {string} gender - 'total', 'H', or 'M'
 * @param {string} ageGroup - Age group or 'all' for all age groups
 * @returns {Object} Data structured for the chart
 */
function calculateDisabilityData(location, gender = 'total', ageGroup = 'all') {
  if (!window.disabilityDataset || !window.disabilityDataset.length) {
    return {
      types: [],
      somePercentages: [],
      alotPercentages: [],
      cannotPercentages: []
    };
  }
  
  // Get data for this location
  let locationData = window.disabilityDataset.filter(row => 
    row["Place of Residence"] === location
  );
  
  // Filter by age group if needed
  if (ageGroup !== 'all') {
    locationData = locationData.filter(row => row["Age Group"] === ageGroup);
  } else {
    // If 'all', use only the Total age group to avoid double counting
    locationData = locationData.filter(row => row["Age Group"] === "Total");
  }
  
  // Get unique disability types
  const disabilityTypes = [...new Set(locationData.map(row => row["Tipo de dificuldade"]))];
  
  // Calculate percentages for each disability type and severity
  const somePercentages = [];
  const alotPercentages = [];
  const cannotPercentages = [];
  
  disabilityTypes.forEach(type => {
    // Filter for this disability type
    const typeData = locationData.filter(row => row["Tipo de dificuldade"] === type);
    
    if (gender === 'total') {
      // For total, we need to sum both genders
      const maleData = typeData.filter(row => row["Gender"] === "H");
      const femaleData = typeData.filter(row => row["Gender"] === "M");
      
      // Get male values
      let maleSome = 0;
      let maleAlot = 0;
      let maleCannot = 0;
      let maleTotal = 0;
      
      if (maleData.length > 0) {
        const maleRow = maleData[0];
        maleSome = parseInt(maleRow["Tem alguma dificuldade"]) || 0;
        maleAlot = parseInt(maleRow["Tem muita dificuldade"]) || 0;
        maleCannot = parseInt(maleRow["Não consegue efetuar a ação"]) || 0;
        const maleNone = parseInt(maleRow["Não tem nenhuma dificuldade"]) || 0;
        
        // Male total for this disability type
        maleTotal = maleNone + maleSome + maleAlot + maleCannot;
      }
      
      // Get female values
      let femaleSome = 0;
      let femaleAlot = 0;
      let femaleCannot = 0;
      let femaleTotal = 0;
      
      if (femaleData.length > 0) {
        const femaleRow = femaleData[0];
        femaleSome = parseInt(femaleRow["Tem alguma dificuldade"]) || 0;
        femaleAlot = parseInt(femaleRow["Tem muita dificuldade"]) || 0;
        femaleCannot = parseInt(femaleRow["Não consegue efetuar a ação"]) || 0;
        const femaleNone = parseInt(femaleRow["Não tem nenhuma dificuldade"]) || 0;
        
        // Female total for this disability type
        femaleTotal = femaleNone + femaleSome + femaleAlot + femaleCannot;
      }
      
      // Calculate combined totals
      const totalPopulation = maleTotal + femaleTotal;
      
      // Calculate combined percentages if there's population data
      if (totalPopulation > 0) {
        somePercentages.push(((maleSome + femaleSome) / totalPopulation) * 100);
        alotPercentages.push(((maleAlot + femaleAlot) / totalPopulation) * 100);
        cannotPercentages.push(((maleCannot + femaleCannot) / totalPopulation) * 100);
      } else {
        somePercentages.push(0);
        alotPercentages.push(0);
        cannotPercentages.push(0);
      }
    } else {
      // For a specific gender, filter by gender
      const genderData = typeData.filter(row => row["Gender"] === gender);
      
      if (genderData.length > 0) {
        const row = genderData[0];
        
        // Calculate total population for this type and gender
        const none = parseInt(row["Não tem nenhuma dificuldade"]) || 0;
        const some = parseInt(row["Tem alguma dificuldade"]) || 0;
        const alot = parseInt(row["Tem muita dificuldade"]) || 0;
        const cannot = parseInt(row["Não consegue efetuar a ação"]) || 0;
        
        const totalPopulation = none + some + alot + cannot;
        
        if (totalPopulation > 0) {
          somePercentages.push((some / totalPopulation) * 100);
          alotPercentages.push((alot / totalPopulation) * 100);
          cannotPercentages.push((cannot / totalPopulation) * 100);
        } else {
          somePercentages.push(0);
          alotPercentages.push(0);
          cannotPercentages.push(0);
        }
      } else {
        // No data for this gender and disability type
        somePercentages.push(0);
        alotPercentages.push(0);
        cannotPercentages.push(0);
      }
    }
  });
  
  // Return the original type names without mapping to shorter versions
  return {
    types: disabilityTypes,
    somePercentages,
    alotPercentages,
    cannotPercentages
  };
}

// Export functions for other modules to use
window.disabilityDataHandler = {
  loadData: loadDisabilityData,
  getDataForLocation: getDisabilityDataForLocation,
  getAgeGroups: getDisabilityAgeGroups,
  getTypes: getDisabilityTypes,
  calculateData: calculateDisabilityData
};