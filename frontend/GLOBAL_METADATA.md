# Demographic Data Tool - Global Metadata

## 1) Folder Structure

```
demographic-tool/
├─ data_cleaned/                       # Cleaned nationality data
│   └─ grande_lisboa_clean/
│       ├─ lisboa_clean.csv
│       ├─ amadora_cascais_loures_clean.csv
│       ├─ mafra_odivelas_oeiras_clean.csv
│       └─ sintra_VilaFrancaDeXira_clean.csv
├─ data_cleaned_studies/               # Cleaned education data
│   └─ grande_lisboa_clean.csv
├─ data_cleaned_dificuldades/          # Cleaned difficulties/disabilities data (NEW)
│   └─ grande_lisboa_dificuldades_clean.csv
├─ data_raw/                           # Raw nationality data before processing
├─ data_raw_studies/                   # Raw education data before processing
├─ data_raw_dificuldades/              # Raw difficulties data before processing (NEW)
├─ old_data_raw/                       # Archived raw nationality data after processing
├─ old_data_raw_studies/               # Archived raw education data after processing
├─ old_data_raw_dificuldades/          # Archived raw difficulties data after processing (NEW)
├─ regions/                            # Region-level data for different datasets
│   ├─ nationality/
│   │   └─ grande_lisboa_just_region_clean.csv
│   ├─ education/
│   │   └─ grande_lisboa_just_region_clean.csv
│   └─ dificuldades/                   # Region-level difficulties data (NEW)
│       └─ grande_lisboa_just_region_clean.csv
├─ scripts/                            # Data processing scripts
│   ├─ fresh_cleaner.py                # Cleans raw nationality data
│   ├─ fresh_cleaner_studies.py        # Cleans raw education data
│   ├─ fresh_cleaner_dificuldades.py   # Cleans raw difficulties data (NEW)
│   └─ fix_region_columns.py           # Formats region-level data files
└─ frontend/
    ├─ index.html                      # Main application HTML
    ├─ css/
    │   ├─ style.css                   # Main styles
    │   ├─ landing.css                 # Landing page styles
    │   ├─ navigation.css              # Navigation styles
    │   ├─ multi-select.css            # Multi-select dropdown styles
    │   ├─ intuitive-filters.css       # Intuitive filters styles (NEW)
    │   ├─ education-chart.css         # Education chart styles
    │   └─ sidebar.css                 # CISOC sidebar styles (NEW)
    └─ js/
        ├─ main.js                     # Application entry point
        ├─ dataHandler.js              # Data loading and handling
        ├─ landing.js                  # Landing page functionality
        ├─ navigation.js               # Navigation functionality
        ├─ crossCalculations.js        # Cross calculation utilities
        ├─ search/
        │   └─ locationSearch.js       # Location search functionality
        ├─ charts/
        │   ├─ nationalityChart.js     # Nationality breakdown chart
        │   ├─ ageDistributionChart.js # Age distribution chart
        │   └─ educationLevelChart.js  # Education level chart
        ├─ tables/
        │   └─ nationalityTable.js     # Nationality table functionality
        └─ segment/
            ├─ segmentChart.js         # Segment distribution chart (NEW)
            ├─ segmentContext.js       # Comparison context handling (NEW)
            ├─ segmentFilters.js       # Traditional filter handling (NEW)
            ├─ segmentFocus.js         # Main segment focus orchestration
            ├─ segmentLocationHelpers.js # Location helper functions (NEW)
            └─ filters/                # Enhanced filter components (NEW)
                ├─ AgeGroupFilters.js   # Age group filter management
                ├─ EducationFilters.js  # Education filter management
                ├─ GenderFilters.js     # Gender filter management
                ├─ IntuitiveFiltersCore.js # Core filter logic
                ├─ NationalityFilters.js # Nationality filter management
                └─ StateManager.js      # Filter state management
```

## 2) Global Variables (Shared Across JS Files)

Below are variables that live on the window object (or are otherwise globally accessible), referenced by multiple modules.

- **window.dataset**
  - Type: Array of Objects.
  - Purpose: Holds all CSV rows loaded from data_cleaned. Each row is typically a demographic record with columns like "Place of Residence," "Age Group," "Gender," etc.
  - Set in: dataHandler.js → loadData().

- **window.studiesDataset**
  - Type: Array of Objects.
  - Purpose: Holds all CSV rows loaded from data_cleaned_studies. Used for education level data.
  - Set in: dataHandler.js → loadStudiesData().

- **window.locationData**
  - Type: Array of Objects.
  - Purpose: Subset of dataset filtered to the currently selected location (place of residence) after the user picks something in the search box.
  - Set in: dataHandler.js → updateData(location).

- **window.selectedNationality**
  - Type: String or null.
  - Purpose: The nationality the user clicked in the "Nationality Breakdown" chart. Used to load an age distribution chart.
  - Modified in: charts/nationalityChart.js (on bar click).

- **window.selectedGender**
  - Type: String, one of "H", "M", "T".
  - Purpose: Tracks which gender button is selected for the Age Distribution chart (Male = "H," Female = "M," or "T" for total).
  - Set in: charts/ageDistributionChart.js.

- **window.filterState** (NEW)
  - Type: Object.
  - Purpose: Stores the state of all filters in the intuitive filter interface.
  - Set in: segment/filters/IntuitiveFiltersCore.js.

- **Chart Instances**
  - **nationalityChart**: A Chart.js instance for showing the main "Nationality Breakdown." Defined in nationalityChart.js.
  - **ageDistributionChart**: A Chart.js instance for "Age Distribution" by nationality. Defined in ageDistributionChart.js.
  - **educationLevelChart**: A Chart.js instance for showing education levels. Defined in educationLevelChart.js.
  - **segmentDistributionChart**: A Chart.js instance for the segment focus section. Defined in segmentChart.js.

## 3) Key Functions & Their Files

Below is a quick reference to the main functions. Each has its own doc comments in its respective file.

### 3.1 dataHandler.js
- **loadData()**
  - Loads CSV files from data_cleaned/ (like lisboa_clean.csv), merges rows into window.dataset.
  - Returns a Promise that resolves once all CSV content is fetched.
- **loadStudiesData()**
  - Loads CSV files from data_cleaned_studies/, merges rows into window.studiesDataset.
  - Returns a Promise that resolves once all studies data is fetched.
- **getLocationType(location)**
  - Determines whether a location is a freguesia, município, or region.
  - Returns a string: "freguesia", "municipio", or "region".
- **getLocationRowsByType(location, expectedType)**
  - Returns the correct rows for a location based on its type.
  - Handles duplicate-named locations properly.
- **updateData(location, locationType)**
  - Filters window.dataset for rows matching location (a "Place of Residence").
  - Updates population info, calls updateNationalityChart(), fillNationalityTable(), etc.
  - Hides the age distribution until a user clicks on a nationality.
  - Now also updates the education chart for the location.
  - Updates the navigation with the current location.

### 3.2 search/locationSearch.js
- **initLocationSearch()**
  - Wires up the search input (#location-search) for user typing.
  - Filters window.dataset by Place of Residence, populates .search-result-item elements in #search-results.
  - On click, calls updateData(selectedLocation, selectedType).
- **initSearchInput(inputSelector, resultsSelector)**
  - Helper function to initialize a search input and its results dropdown.
  - Used for both the header search and landing page search.

### 3.3 charts/nationalityChart.js
- **initNationalityChart()**
  - Creates the Nationality Breakdown Chart.js bar chart in #nationalityChart.
  - Sets up click events for highlighting bars and updating window.selectedNationality.
- **updateNationalityChart(nationalityData)**
  - Updates the chart's labels and dataset with the top nationalities for the selected location.
  - Typically called after updateData() to reflect new location data.

### 3.4 charts/ageDistributionChart.js
- **initAgeDistributionChart()**
  - Creates the Age Distribution bar chart in #ageDistributionChart.
  - Binds the gender buttons (#male-age-btn, #female-age-btn, #total-age-btn) to switch window.selectedGender.
- **updateAgeDistribution(nationality, gender)**
  - Filters window.locationData for rows matching that nationality + gender.
  - Updates the chart with the resulting age-group counts.

### 3.5 charts/educationLevelChart.js
- **initEducationChart(canvasId)**
  - Initializes the Education Level Chart.
  - Sets up the chart container and event listeners.
- **updateEducationChartByLocation(location)**
  - Updates the chart based on the selected location.
  - Filters the studies dataset for the location and updates the chart.

### 3.6 tables/nationalityTable.js
- **fillNationalityTable(nationalityData)**
  - Fills #nationalityTable with rows for each nationality (male/female/total counts).

### 3.7 calculations/crossCalculations.js
- **crossCalculation(locationData, maleRow, femaleRow, individualNationalityKeys)**
  - Figures out the "most present nationality," the most common gender for it, and the top age segment.
  - Returns HTML with the breakdown, inserted into #cross-calc by updateData().

### 3.8 segment/segmentFocus.js
- **initSegmentFocus()**
  - Initializes the segment focus section.
  - Sets up traditional filter interface and comparison context.
  - Does not initialize intuitive filters directly (deferred until data is available).
- **populateSegmentData()**
  - Populates data for segment analysis based on the selected location's parent.
  - Also initializes intuitive filters if not already done.
- **restoreSegmentState()**
  - Restores segment filters and other UI elements when navigating back to segment view.
- **saveFilterState()**
  - Saves the current filter state to sessionStorage.

### 3.9 segment/segmentChart.js (NEW)
- **initSegmentChart()**
  - Initializes the segment distribution chart.
- **updateSegmentChart(displayMode)**
  - Updates the segment distribution chart based on current selections.
  - Handles both percentage and absolute number display modes.
- **updateFilterSummary()**
  - Updates the filter summary display with current selections.

### 3.10 segment/segmentContext.js (NEW)
- **updateComparisonContextButtons()**
  - Updates the comparison context buttons based on location type.
- **updateComparisonContext(contextMode)**
  - Updates the comparison context based on the selected option.
- **initComparisonContext()**
  - Initializes context-related event handlers.

### 3.11 segment/filters/IntuitiveFiltersCore.js (NEW)
- **initIntuitiveFilters()**
  - Initializes the intuitive filters components.
- **updateIntuitiveFiltersFromData()**
  - Updates filter state based on changes in location data.
- **applyFiltersToChart(isEducation)**
  - Applies current filter state to update the segment chart.
- **resetFilterState()**
  - Resets all filter state to defaults.
- **saveIntuitiveFilterState()**
  - Saves filter state to sessionStorage.
- **restoreIntuitiveFilterState()**
  - Restores filter state from sessionStorage.

## 4) Data Processing Scripts (NEW)

### 4.1 fresh_cleaner.py
- **Purpose**: Cleans raw nationality data files from INE.
- **Input**: Raw CSV files in `data_raw/` folder.
- **Output**: Cleaned CSV files in `data_cleaned/` folder.
- **Usage**: `python fresh_cleaner.py`

### 4.2 fresh_cleaner_studies.py
- **Purpose**: Cleans raw education level data files from INE.
- **Input**: Raw CSV files in `data_raw_studies/` folder.
- **Output**: Cleaned CSV files in `data_cleaned_studies/` folder.
- **Usage**: `python fresh_cleaner_studies.py`

### 4.3 fresh_cleaner_dificuldades.py (NEW)
- **Purpose**: Cleans raw difficulties/disabilities data files from INE.
- **Input**: Raw CSV files in `data_raw_dificuldades/` folder.
- **Output**: Cleaned CSV files in `data_cleaned_dificuldades/` folder.
- **Usage**: `python fresh_cleaner_dificuldades.py`

### 4.4 fix_region_columns.py
- **Purpose**: Ensures region files have correct column structure.
- **Input**: Region CSV files in `regions/` subfolders.
- **Output**: Updates the same files in place with correct region column formatting.
- **Usage**: `python fix_region_columns.py`

## 5) Important DOM Elements

In index.html, the following IDs are referenced in code:

- **Header and Navigation:**
  - #back-to-landing (link to return to landing page)
  - #current-location-name (shows selected location name)
  - #toggle-view-button (toggles between location overview and segment analysis)
  - #segment-button-text (text content for the segment toggle button)

- **Search:**
  - #landing-search (landing page search input)
  - #landing-search-results (dropdown for landing search matches)
  - #location-search (header search input)
  - #search-results (dropdown for header search matches)

- **Views:**
  - #landing-page (landing page container)
  - #data-dashboard (dashboard container)
  - #location-overview (location overview section)
  - #segment-analysis (segment analysis section)

- **Overview Section:**
  - #population, #maleCount, #femaleCount (display total, male, female counts)

- **Charts:**
  - #nationalityChart (canvas for the nationality bar chart)
  - #ageDistributionChart (canvas for the age distribution bar chart)
  - #educationLevelChart (canvas for the education level chart)
  - #segmentDistributionChart (canvas for the segment distribution chart)

- **Age Distribution Controls:**
  - #age-distribution-section (container for age distribution)
  - #selected-nationality (span showing selected nationality)
  - #male-age-btn, #female-age-btn, #total-age-btn (gender buttons)

- **Nationality Table:**
  - #nationalityTable (table showing top foreign nationalities)
  - #others-info (displaying counts for "others" categories by continent)
  - #cross-calc (section for cross-calculation HTML)

- **Segment Focus Section:**
  - #segment-focus-section (container for segment focus)
  - #parent-location-name (shows parent location name)
  - #comparison-context-toggle (container for comparison context buttons)
  - #comparison-context-buttons (buttons for switching comparison context)
  - #region-view-toggle (toggle for region view mode)
  - #region-view-mode (select element for region view mode)

- **Traditional Filters:**
  - #nationality-dataset-btn, #education-dataset-btn (dataset toggle buttons)
  - #nationality-filters, #education-filters (filter containers)
  - #nationality-select, #age-group-select, #gender-select (nationality dataset filters)
  - #education-level-select, #edu-age-group-select, #edu-gender-select (education dataset filters)
  - #apply-filters-btn, #apply-edu-filters-btn (filter apply buttons)

- **Intuitive Filters (NEW):**
  - #nationality-intuitive-filters, #education-intuitive-filters (intuitive filter containers)
  - #all-nationalities-btn (button to select all nationalities)
  - #nationality-search (nationality search input)
  - #nationality-search-results (nationality search results dropdown)
  - #nationality-tags (container for selected nationality tags)
  - #age-group-buttons, #edu-age-group-buttons (containers for age group buttons)
  - #education-level-buttons (container for education level buttons)
  - #apply-intuitive-filters, #apply-intuitive-edu-filters (apply buttons for intuitive filters)

- **Filter Status:**
  - #nationality-filter-status, #age-filter-status, #gender-filter-status (status indicators for nationality filters)
  - #education-level-filter-status, #edu-age-filter-status, #edu-gender-filter-status (status indicators for education filters)

- **Results:**
  - #segment-name (shows selected segment name)
  - #nationality-filter-summary, #education-filter-summary (filter summary containers)

## 6) Dataset Information

### 6.1 Nationality, Age, and Gender Dataset

- **Folder:** `demographic-tool/data_cleaned/`
- **Structure:**
  - Contains detailed demographic data with age groups, gender, and nationalities.
  - Age Groups: 0-4, 5-9, 10-14, ..., 75-79, 80-84, 85+
  - Gender: "H" (Male), "M" (Female)
  - Special Rows: Each location has "Total" rows that aggregate across all age groups.
  - Nationality Columns: Both individual nationalities and aggregated categories (Europa, África, etc.)
  - Key Columns: 
    - Place of Residence: Location name
    - Age Group: Age range
    - Gender: "H" or "M"
    - Total: Total population for this demographic group
    - [Various nationalities]: Population counts by nationality
    - freguesia_code: Numeric code that identifies the location's geographic level
    - municipio: Parent municipality name
    - region: Parent region name

### 6.2 Education Level Dataset

- **Folder:** `demographic-tool/data_cleaned_studies/`
- **Description:** Contains demographic data cross-tabulating nationality with levels of studies (educational attainment).
- **Structure:**
  - Uses broader age groups: 0-15, 15-19, 20-24, 25-64, 65-74, 75+
  - Education Levels:
    - "Nenhum" (No Education)
    - "Ensino básico" (Basic Education)
    - "Ensino secundário" (Secondary Education)
    - "Ensino pós-secundário" (Post-Secondary)
    - "Ensino superior" (Higher Education)
  - Key Columns: Similar structure to nationality dataset, but with education level columns instead of nationality columns

### 6.3 Difficulties/Disabilities Dataset (NEW)

- **Folder:** `demographic-tool/data_cleaned_dificuldades/`
- **Description:** Contains demographic data about difficulties/disabilities by type and degree.
- **Structure:**
  - Similar structure to other datasets, with dimensions for:
    - Place of Residence: Location name
    - Age Group: Age ranges
    - Gender: "H" or "M"
    - Tipo de dificuldade: Type of difficulty/disability
    - Grau de dificuldade: Degree of difficulty/disability
  - Contains population counts for different types and degrees of difficulties
  - Has the same location-related columns (freguesia_code, municipio, region)

## 7) Data Processing Workflow (NEW)

### 7.1 Nationality Data
- Put raw nationality data files in `data_raw/` folder
- Run `python fresh_cleaner.py` to process the data
- Cleaned files are saved to `data_cleaned/`
- Original raw files are moved to `old_data_raw/` after processing

### 7.2 Education Data
- Put raw education data files in `data_raw_studies/` folder
- Run `python fresh_cleaner_studies.py` to process the data
- Cleaned files are saved to `data_cleaned_studies/`
- Original raw files are moved to `old_data_raw_studies/` after processing

### 7.3 Difficulties/Disabilities Data (NEW)
- Put raw difficulties data files in `data_raw_dificuldades/` folder
- Run `python fresh_cleaner_dificuldades.py` to process the data
- Cleaned files are saved to `data_cleaned_dificuldades/`
- Original raw files are moved to `old_data_raw_dificuldades/` after processing

### 7.4 Region-level Data
- Region-level data must be processed separately from municipalities and freguesias
- After cleaning data, extract region-level data to appropriate subfolder in `regions/`
- Run `python fix_region_columns.py` to ensure proper formatting of region files
- The fix_region_columns.py script processes all region folders (nationality, education, dificuldades)

## 8) Important Notes About Data

### 8.1 Data Structure Differences
- Nationality data: Detailed age groups, gender, and nationality breakdown
- Education data: Broader age groups, gender, and education level breakdown
- Difficulties data: Detailed breakdown by type and degree of difficulty

### 8.2 Region vs Municipality vs Freguesia
- These three geographic levels have different structures in the data
- Region-level data needs special handling (separate download, different processing)
- The system uses the freguesia_code length to distinguish levels:
  - 3 digits for regions
  - 4 digits for municipalities
  - 6+ digits for freguesias

### 8.3 Duplicate Names
- Some locations may have the same name but represent different geographic levels
- The system distinguishes them using freguesia_code and proper region/municipality annotation

### 8.4 Data Download
- Municipality and freguesia data should be downloaded together
- Region data must be downloaded separately
- Always select the appropriate geographic level when downloading from INE

## 9) Dependent Libraries

The application depends on the following external libraries:

- **jQuery 3.6.0** - For DOM manipulation and event handling
- **Chart.js 3.7.0** - For all data visualizations
- **Select2 4.0.13** - For searchable dropdowns in the segment focus section
- **Font Awesome 6.0.0-beta3** - For icons throughout the interface

These libraries are loaded via CDN in the index.html file.

## 10) Recent Feature Additions

### 10.1 Intuitive Filters Interface (NEW)
- Added a more user-friendly filtering interface for segment analysis
- Includes quick select buttons for age groups and gender
- Features searchable nationality selection with tags
- Provides real-time filter status indicators

### 10.2 Comparison Context Selection (NEW)
- Added ability to switch between direct parent (municipality) and region context
- Makes it easier to compare freguesias within municipalities or within the entire region
- Dynamically adjusts to the location type

### 10.3 Region View Toggle (NEW)
- Added option to switch between municipalities and freguesias when viewing region data
- Allows different levels of geographic detail in segment analysis

### 10.4 Difficulties/Disabilities Dataset Support (NEW)
- Added support for the new difficulties/disabilities dataset
- Created specialized processing scripts and integration

### 10.5 CISOC Styling Integration (NEW)
- Added the CISOC dot sidebar for visual consistency with CISOC design
- Integrated the sidebar with the header for a seamless appearance

## 11) Recent Major Changes

### 11.1 Filter System Overhaul
- Replaced the dropdown-only filter system with a more intuitive interface
- Split filter logic into separate modules for better organization
- Added state management for filter selections

### 11.2 Data Processing Improvements
- Enhanced handling of special characters and CSV parsing
- Better detection of problematic data rows
- Improved debugging information during data processing

### 11.3 Code Modularization
- Significantly improved code organization with more specialized modules
- Created separate modules for different aspects of segment analysis
- Better separation of concerns between components

### 11.4 Backend Processing Scripts
- Moved data processing logic to standalone Python scripts
- Created specialized scripts for each dataset type
- Added script for handling region-level data consistently

### 11.5 State Management
- Improved session storage usage for better state persistence
- Added ability to save and restore filter states
- Better handling of navigation between views