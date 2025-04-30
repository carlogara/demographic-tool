/**
 * File: dataHandler.js
 * Location: demographic-tool/frontend/js/dataHandler.js
 * Purpose:
 *   - Loads CSV data from data_cleaned and regions folders
 *   - Holds the "dataset" array globally for cross-module use
 *   - Contains updateData() for updating displayed charts/tables when a location is chosen
 */

window.dataset = [];         // Global array for demographic data
window.studiesDataset = [];  // Global array for education/studies data
window.disabilityDataset = []; // Global array for disability data

const continentMapping = {
  "Europa": ["Alemanha", "Áustria", "Bélgica", "Bulgária", "Espanha", "França", "Irlanda", "Itália", "Luxemburgo",
             "Países Baixos", "Polónia", "Roménia", "Suécia", "Federação da Rússia", "Suíça", "Ucrânia"],
  "África": ["África do Sul", "Angola", "Cabo Verde", "Guiné-Bissau", "Moçambique", "São Tomé e Príncipe"],
  "América": ["Canadá", "Estados Unidos da América", "Argentina", "Brasil", "Venezuela"],
  "Ásia": ["Bangladeche", "China", "Índia", "Nepal", "Paquistão"],
  "Oceânia": []
};

/**
 * Helper function to correctly count fields in a CSV line, respecting quoted sections
 * @param {string} line - A single line from CSV
 * @returns {number} The correct field count
 */
function countFieldsRespectingQuotes(line) {
  let count = 1; // Start with 1 since field count = comma count + 1
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Only count commas outside of quotes
      count++;
    }
  }
  
  return count;
}

/**
 * Much simpler approach to debug and fix quoted field issues
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Parsed data objects
 */
function simpleParseCsv(csvText) {
  // Add debugging info
  console.log("Parsing CSV with length:", csvText.length);
  console.log("CSV sample:", csvText.substring(0, 200));
  
  // Split into lines
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  console.log(`Found ${lines.length} non-empty lines`);
  
  if (lines.length < 2) return [];
  
  // Get headers
  const headers = lines[0].split(',').map(header => header.trim());
  console.log("Headers:", headers);
  
  // For debugging - find problematic lines
  const problematicLines = [];
  for (let i = 1; i < lines.length; i++) {
    // Count fields properly respecting quotes
    const fieldCount = countFieldsRespectingQuotes(lines[i]);
    if (fieldCount !== headers.length) {
      // Only log as a debug message if needed
      // console.debug(`Line ${i} has ${fieldCount} fields but expected ${headers.length}`);
      problematicLines.push({ lineNumber: i, content: lines[i] });
    }
  }
  
  if (problematicLines.length > 0) {
    console.log(`Found ${problematicLines.length} problematic lines`);
  }
  
  // Process each data line
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle quoted fields as special case
    let fields = [];
    let inQuotes = false;
    let currentField = '';
    let j = 0;
    
    while (j < line.length) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        j++;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField);
        currentField = '';
        j++;
      } else {
        currentField += char;
        j++;
      }
    }
    
    // Add the last field
    fields.push(currentField);
    
    // Check if field count matches header count
    if (fields.length !== headers.length) {
      console.warn(`Skipping row ${i}: found ${fields.length} fields but expected ${headers.length}`);
      continue;
    }
    
    // Create the object
    const obj = {};
    headers.forEach((header, index) => {
      const value = fields[index].trim();
      
      // Preserve freguesia_code as string, convert other numeric values
      if (header !== 'freguesia_code' && !isNaN(value) && value !== '') {
        obj[header] = parseFloat(value);
      } else {
        obj[header] = value;
      }
    });
    
    result.push(obj);
  }
  
  console.log(`Successfully parsed ${result.length} rows`);
  
  // Debug: Check for places with commas
  const placesWithCommas = result.filter(row => 
    row["Place of Residence"] && row["Place of Residence"].includes(','));
  
  console.log(`Found ${placesWithCommas.length} places with commas`);
  if (placesWithCommas.length > 0) {
    console.log("Sample places with commas:", placesWithCommas.slice(0, 3));
  }
  
  return result;
}

// Sample debugging function
function testParsing(url) {
  fetch(url)
    .then(response => response.text())
    .then(data => {
      console.log("Raw CSV sample:", data.substring(0, 500));
      
      // Look for any entries with quotes in Place of Residence
      const lines = data.split('\n');
      const placeIndex = lines[0].split(',').findIndex(header => 
        header.trim() === 'Place of Residence');
      
      if (placeIndex >= 0) {
        const problematicLines = lines.filter(line => {
          const fields = line.split(',');
          return fields.length > placeIndex && fields[placeIndex] && fields[placeIndex].includes('"');
        });
        
        console.log(`Found ${problematicLines.length} lines with quotes in Place of Residence`);
        if (problematicLines.length > 0) {
          console.log("Sample problematic line:", problematicLines[0]);
        }
      }
      
      // Try the simple parser
      const parsed = simpleParseCsv(data);
      console.log(`Parsed ${parsed.length} rows`);
      
      // Check for places with commas
      const placesWithCommas = parsed.filter(row => 
        row["Place of Residence"] && row["Place of Residence"].includes(','));
      
      console.log(`Found ${placesWithCommas.length} places with commas`);
      if (placesWithCommas.length > 0) {
        console.log("Sample place with comma:", placesWithCommas[0]);
      }
    })
    .catch(error => console.error("Error testing parsing:", error));
}

// You can call this from the browser console:
// testParsing('../data_cleaned/grande_lisboa_clean/lisboa_clean.csv')

/**
 * Loads demographic data from main folders and region folders
 * Called once at startup in main.js
 */
async function loadData() {
  try {
    // Regular data from data_cleaned
    const dataFolder = "../data_cleaned/grande_lisboa_clean/";
    const urls = [
      dataFolder + 'lisboa_clean.csv',
      dataFolder + 'amadora_cascais_loures_clean.csv',
      dataFolder + 'mafra_odivelas_oeiras_clean.csv',
      dataFolder + 'sintra_VilaFrancaDeXira_clean.csv'
    ];
    
    // Region data from regions/nationality folder
    const regionDataFolder = "../regions/nationality/";
    const regionUrls = [
      regionDataFolder + 'grande_lisboa_just_region_clean.csv'
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
        
        // Try the new parser
        console.log(`Processing file: ${url}`);
        const csvData = simpleParseCsv(data);
        
        if (csvData.length === 0) {
          console.warn(`Invalid or empty parsed data for file: ${url}, skipping.`);
          continue;
        }
        
        allData = allData.concat(csvData);
        console.log(`Loaded ${csvData.length} rows from ${url}`);
      } catch (error) {
        console.warn(`Error processing ${url}: ${error.message}`);
      }
    }
    
    window.dataset = allData;
    console.log(`Total dataset size: ${window.dataset.length} rows`);
    
    // Call the debug function after loading data
    debugDataset();
  } catch (error) {
    console.error("Error loading CSV:", error);
  }
}

/**
 * Loads education/studies data from main folders and region folders
 * Called once at startup in main.js
 */
async function loadStudiesData() {
  try {
    // Regular studies data
    const studiesFolder = "../data_cleaned_studies/";
    const urls = [
      studiesFolder + 'grande_lisboa_clean.csv'
    ];
    
    // Region studies data
    const regionStudiesFolder = "../regions/education/";
    const regionUrls = [
      regionStudiesFolder + 'grande_lisboa_just_region_clean.csv'
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
        
        // Try the new parser
        console.log(`Processing studies file: ${url}`);
        const csvData = simpleParseCsv(data);
        
        if (csvData.length === 0) {
          console.warn(`Invalid or empty parsed data for file: ${url}, skipping.`);
          continue;
        }
        
        allData = allData.concat(csvData);
        console.log(`Loaded ${csvData.length} rows from ${url} (studies)`);
      } catch (error) {
        console.warn(`Error processing ${url}: ${error.message}`);
      }
    }
    
    window.studiesDataset = allData;
    console.log(`Total studies dataset size: ${window.studiesDataset.length} rows`);
  } catch (error) {
    console.error("Error loading studies CSV:", error);
  }
}

/**
 * Loads disability data from the main data and region folders
 * Called once from main.js, after CSV data is loaded
 */
async function loadDisabilityData() {
  try {
    // Regular data from data_cleaned_dificuldades
    const dataFolder = "../data_cleaned_dificuldades/";
    const urls = [
      dataFolder + 'grande_lisboa_dificuldades_clean.csv'
    ];
    
    // Region data from regions/dificuldades folder
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
 * Determine the type of location (freguesia, município, or region)
 * Uses code length to distinguish between different types:
 * - Regions: 3 digits
 * - Municipalities: 4 digits
 * - Freguesias: 6+ digits
 * 
 * @param {string} location - The location name
 * @returns {string} - "freguesia", "municipio", or "region"
 */
function getLocationType(location) {
  if (!window.dataset || window.dataset.length === 0) return "";
  
  // Debug: Log the exact location being looked up
  console.log(`Looking up location type for: '${location}'`);
  
  // Get all rows for this location
  const locationRows = window.dataset.filter(row => row["Place of Residence"] === location);
  
  if (locationRows.length === 0) {
    console.error(`No data found for location: '${location}'`);
    return "";
  }
  
  // Get a sample row to check its code
  const sampleRow = locationRows[0];
  
  console.log("Sample row for this location:", sampleRow);
  
  // Check the freguesia_code length/format
  if (sampleRow.freguesia_code) {
    const code = sampleRow.freguesia_code;
    
    // Check for region - regions have 3 digits
    if (code.length === 3) {
      return "region";
    }
    
    // Check for município - typically 4 digits
    if (code.length === 4) {
      return "municipio";
    }
    
    // Check for freguesia - longer codes (typically 6+ digits)
    if (code.length >= 6) {
      return "freguesia";
    }
  }
  
  // Fallback to relationship between columns if code length check fails
  if (sampleRow["Place of Residence"] === sampleRow.municipio) {
    return "municipio";
  } else if (sampleRow["Place of Residence"] === sampleRow.region) {
    return "region";
  }
  
  // Default to freguesia
  return "freguesia";
}

/**
 * Helper function to get the correct rows for a location based on its type
 * Uses code length to filter rows for duplicate-named locations
 * 
 * @param {string} location - The location name
 * @param {string} expectedType - The expected type ("region", "municipio", or "freguesia")
 * @returns {Array} - The filtered dataset rows
 */
function getLocationRowsByType(location, expectedType) {
  // Get all rows for this location
  const allRows = window.dataset.filter(row => row["Place of Residence"] === location);
  
  if (allRows.length === 0) {
    console.error(`No rows found for location: '${location}'`);
    return [];
  }
  
  // Return all rows if they all have the same type
  if (allRows.every(row => getRowType(row) === expectedType)) return allRows;
  
  // Filter to only rows of the expected type
  return allRows.filter(row => getRowType(row) === expectedType);
  
  // Helper to determine a single row's type
  function getRowType(row) {
    if (row.freguesia_code) {
      const code = row.freguesia_code;
      if (code.length === 3) return "region";
      if (code.length === 4) return "municipio";
      if (code.length >= 6) return "freguesia";
    }
    
    // Fallback to relationship check
    if (row["Place of Residence"] === row.municipio) return "municipio";
    if (row["Place of Residence"] === row.region) return "region";
    return "freguesia";
  }
}

/**
 * Updates your UI for a given location (place of residence)
 * 
 * @param {string} location - The selected location name
 * @param {string} [locationType] - Optional explicit location type from search
 */
function updateData(location, locationType) {
  if (!location) return;
  
  // Debug: Log exact location name and type
  console.log(`updateData called for location: '${location}', type: ${locationType || 'auto-detect'}`);
  
  // If location type wasn't provided explicitly, detect it
  if (!locationType) {
    locationType = getLocationType(location);
  }
  
  console.log(`Detected location type: ${locationType}`);
  
  // Filter data based on location and type
  let locationData = getLocationRowsByType(location, locationType);
  
  if (locationData.length === 0) {
    console.error(`No data found for location: ${location}`);
    return;
  }

  console.log(`Found ${locationData.length} rows for location: ${location}`);

  // Make locationData accessible globally
  window.locationData = locationData;
  
  const maleRow   = locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "H") || {};
  const femaleRow = locationData.find(r => r["Age Group"] === "Total" && r["Gender"] === "M") || {};
  
  const totalMen   = parseInt(maleRow["Total"])   || 0;
  const totalWomen = parseInt(femaleRow["Total"]) || 0;
  const totalPopulation = totalMen + totalWomen;
  
  $("#population").text(totalPopulation);
  $("#maleCount").text(totalMen);
  $("#femaleCount").text(totalWomen);
  
  const reservedKeys = [
    "Place of Residence", "Age Group", "Gender", "Total", 
    "Portuguesa", "Estrangeira", "Europa", "África", 
    "América", "Ásia", "Oceânia", "freguesia_code", "municipio", "region"
  ];
  
  // Collect nationality data
  const individualNationalityKeys = Object.keys(maleRow).filter(key => !reservedKeys.includes(key));
  const nationalityData = [];
  
  individualNationalityKeys.forEach(nationality => {
    const maleCount   = parseInt(maleRow[nationality])   || 0;
    const femaleCount = parseInt(femaleRow[nationality]) || 0;
    const natTotal    = maleCount + femaleCount;
    
    if (natTotal > 0) {
      nationalityData.push({
        nationality: nationality,
        male:   maleCount,
        female: femaleCount,
        total:  natTotal
      });
    }
  });
  
  // Sort by total population (descending)
  nationalityData.sort((a, b) => b.total - a.total);
  
  // Update table
  fillNationalityTable(nationalityData);    // from tables/nationalityTable.js
  
  // Update chart
  updateNationalityChart(nationalityData);  // from charts/nationalityChart.js
  
  // Hide age distribution section when location changes
  $("#age-distribution-section").hide();
  
  // Reset selected nationality
  window.selectedNationality = null;
  
  // Others Categories
  let othersBreakdownHTML = "";
  Object.keys(continentMapping).forEach(continent => {
    let maleContinent   = parseInt(maleRow[continent])   || 0;
    let femaleContinent = parseInt(femaleRow[continent]) || 0;
    let totalContinent  = maleContinent + femaleContinent;

    let knownMaleTotal   = 0;
    let knownFemaleTotal = 0;

    continentMapping[continent].forEach(country => {
      knownMaleTotal   += parseInt(maleRow[country])   || 0;
      knownFemaleTotal += parseInt(femaleRow[country]) || 0;
    });

    let knownTotal = knownMaleTotal + knownFemaleTotal;
    let othersCount = Math.max(totalContinent - knownTotal, 0);
    othersBreakdownHTML += `<p><strong>${continent} Others:</strong> ${othersCount} people</p>`;
  });
  $("#others-info").html(othersBreakdownHTML);
  
  // Cross calculations
  let crossCalcHTML = crossCalculation(locationData, maleRow, femaleRow, individualNationalityKeys);
  $("#cross-calc").html(crossCalcHTML);
  
  // Update the education chart for this location
  if (window.educationChartModule) {
    window.educationChartModule.updateByLocation(location);
  }
  
  // Force update the disability chart for this location
  if (window.disabilityChartModule && typeof window.disabilityChartModule.forceUpdate === 'function') {
    // Use a short delay to ensure all data is ready
    setTimeout(() => {
      window.disabilityChartModule.forceUpdate();
    }, 100);
  }
  
  // Update the navigation with the current location
  if (typeof updateNavigationLocation === 'function') {
    updateNavigationLocation(location);
  }
  
  // Update the segment button text with the location name
  $('.segment-location').text(location);
  
  // Make sure we're showing the location overview
  $('#segment-analysis').hide();
  $('#location-overview').show();
  $('#toggle-view-button').removeClass('active');
  updateSegmentButtonText();
  $('#toggle-view-button').find('i').removeClass('fa-chevron-left').addClass('fa-chevron-right');
  
  // Populate segment data
  if (window.segmentFocusModule && window.segmentFocusModule.populateSegmentData) {
    window.segmentFocusModule.populateSegmentData();
  }
}

/**
 * Debug function to analyze dataset structure and troubleshoot issues
 */
function debugDataset() {
  console.log("Dataset size:", window.dataset ? window.dataset.length : 0);
  
  // Log locations with commas
  const locationsWithCommas = [...new Set(window.dataset
    .filter(row => row["Place of Residence"] && row["Place of Residence"].includes(','))
    .map(row => row["Place of Residence"]))];
  
  console.log(`Found ${locationsWithCommas.length} unique locations with commas:`);
  console.log(locationsWithCommas);
  
  // Get all unique regions
  const regions = [...new Set(window.dataset.filter(row => row.region).map(row => row.region))];
  console.log("Regions:", regions);
  
  // Get all unique municipalities
  const municipalities = [...new Set(window.dataset.filter(row => row.municipio).map(row => row.municipio))];
  console.log("Municipalities:", municipalities);
  
  // Count freguesias per municipio
  const freguesiasByMunicipio = {};
  municipalities.forEach(municipio => {
    const freguesias = [...new Set(window.dataset
      .filter(row => row.municipio === municipio && row["Place of Residence"] !== municipio)
      .map(row => row["Place of Residence"]))];
    freguesiasByMunicipio[municipio] = freguesias.length;
  });
  console.log("Freguesias by municipio:", freguesiasByMunicipio);
  
  // Check region data specifically
  const regionData = window.dataset.filter(row => row["Place of Residence"] === "Grande Lisboa");
  console.log("Grande Lisboa data rows:", regionData.length);
  
  // Check if there are rows where Place of Residence equals region
  const regionMatches = window.dataset.filter(row => row["Place of Residence"] === row.region);
  console.log("Rows where Place of Residence equals region:", regionMatches.length);
  
  // Log the first region data row to see its structure
  if (regionData.length > 0) {
    console.log("Sample Grande Lisboa data:", regionData[0]);
  }
}

// Make the debug function globally available
window.debugDataset = debugDataset;