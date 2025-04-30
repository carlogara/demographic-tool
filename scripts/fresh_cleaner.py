import os
import pandas as pd
import re  # For cleaning place names
import shutil  # For moving processed files

def clean_ine_data(file_path, output_path, municipios_regions_path):
    """
    Cleans an INE dataset by:
    - Skipping metadata
    - Extracting correct headers
    - Forward-filling missing values
    - Removing "Year" column
    - Cleaning "Place of Residence"
    - Ensuring correct column alignment
    - Converting numeric values properly
    - Tagging municipios and freguesias with their corresponding municipio and region
    """
    try:
        # Load municipios_regions.csv for cross-referencing
        municipios_df = pd.read_csv(municipios_regions_path, encoding="utf-8-sig", dtype=str)
        municipios_df = municipios_df[['code', 'location', 'type', 'region']]
        
        # Ensure the 'code' column is treated as a string
        municipios_df['code'] = municipios_df['code'].astype(str)
        
        # Create lookup dictionaries ONLY for municipalities
        location_lookup = {}
        region_lookup = {}
        
        for index, row in municipios_df.iterrows():
            code = row['code']
            location = row['location']
            region = row['region']
            type_ = row['type']
            
            if type_ == 'municipio':
                # Store only municipality codes in the lookups
                location_lookup[code] = location
                region_lookup[code] = region
        
        # --- STEP 1: Load dataset, skipping metadata rows. ---
        header_row = 8  # adjust if needed
        df = pd.read_csv(
            file_path,
            encoding="ISO-8859-1",
            delimiter=";",
            skiprows=header_row,
            dtype=str
        )

        # --- STEP 2: Rename the first column explicitly. ---
        df.rename(columns={df.columns[0]: "Place of Residence"}, inplace=True)

        # --- STEP 3: Remove the "N.º" row immediately after headers. ---
        #     (which is typically a single row that doesn't contain data)
        df = df[1:].reset_index(drop=True)

        # --- STEP 4: Forward-fill missing values for place names and age groups. ---
        df.iloc[:, 0] = df.iloc[:, 0].ffill()  # forward-fill Place of Residence
        df.iloc[:, 1] = df.iloc[:, 1].ffill()  # forward-fill Age Group
        
        # --- STEP 5: Extract correct nationality headers from row 7 of the raw CSV. ---
        df_headers = pd.read_csv(
            file_path,
            encoding="ISO-8859-1",
            delimiter=";",
            skiprows=7,
            nrows=1,
            dtype=str
        )
        
        # We have the first 4 columns: [Place of Residence, Age Group, Gender, Year]
        # The rest are nationality columns.
        actual_columns = len(df.columns) - 4
        nationality_headers = df_headers.iloc[0, 4:].dropna().tolist()
        
        if len(nationality_headers) > actual_columns:
            nationality_headers = nationality_headers[:actual_columns]
        elif len(nationality_headers) < actual_columns:
            nationality_headers += ["Unknown_Column"] * (actual_columns - len(nationality_headers))
        
        # --- STEP 6: Apply correct column names. ---
        new_columns = ["Place of Residence", "Age Group", "Gender", "Year"] + nationality_headers
        df.columns = new_columns
        
        # --- STEP 7: Remove the "Year" column (not needed). ---
        df = df.drop(columns=["Year"], errors="ignore")
        
        # --------------------------------------------------------------------
        # STEP 8: EXTRACT THE FREGUESIA CODE & KEEP IT IN A NEW COLUMN
        # --------------------------------------------------------------------
        df['freguesia_code'] = df['Place of Residence'].str.extract(r'^(\d+):')
        df['freguesia_code'] = df['freguesia_code'].astype(str)

        # Debug prints
        print("INE dataset 'Place of Residence' (raw):\n", df['Place of Residence'].head())
        print("INE dataset 'freguesia_code':\n", df['freguesia_code'].head())
        print("Municipios dataset 'code' values:\n", municipios_df['code'].head())
        
        print("\nDEBUG: First 20 rows of raw INE data (Place of Residence):")
        print(df['Place of Residence'].head(20))
        print("\nDEBUG: First 20 rows of municipios_regions data (municipio only):")
        print(municipios_df[municipios_df['type'] == 'municipio'].head(20))

        # --- STEP 9: Clean "Place of Residence" by removing numeric codes. ---
        def clean_place_name(name):
            # remove numeric code + colon from beginning
            cleaned_name = re.sub(r'^\d+:\s*', '', str(name))
            # if it has commas, wrap with quotes
            if "," in cleaned_name:
                return f'"{cleaned_name}"'
            return cleaned_name

        df['Place of Residence'] = df['Place of Residence'].apply(clean_place_name)
        
        # --- STEP 10: Map municipality & region from the code lookups. ---
        df['municipio'] = df['freguesia_code'].map(location_lookup)
        df['region'] = df['freguesia_code'].map(region_lookup)
        
        # Debug: check how it looks when the code changes
        print("\nDEBUG: Sample rows showing new code transitions:")
        code_changes = df[df['freguesia_code'] != df['freguesia_code'].shift()]
        print(code_changes[['Place of Residence', 'freguesia_code', 'municipio', 'region']].head(10))
        
        # --- STEP 11: Forward-fill region and location for parishes. ---
        df['municipio'] = df['municipio'].ffill()
        df['region'] = df['region'].ffill()
        
        # --- STEP 12: Remove leftover metadata rows (where crucial columns might be NaN). ---
        df = df[df["Place of Residence"].notna() & df["Age Group"].notna() & df["Gender"].notna()]

        # --- STEP 13: Ensure at least one nationality column has a non-zero entry. ---
        # The nationality columns are between "Gender" and "freguesia_code"/"municipio"/"region".
        # Indexes: 0=Place,1=AgeGroup,2=Gender -> nationalities start at col index 3 until the last 3 columns
        nationality_cols = df.columns[3:-3]  # everything except the last 3 columns (freguesia_code, municipio, region)
        df = df[(df[nationality_cols] != '0').any(axis=1)]  # must have at least one non-zero in nationalities

        # --- STEP 14: Convert those nationality columns to numeric & fill NaNs with 0. ---
        for col in nationality_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
        
        # --- STEP 15: Remove any "Unknown_Column" if present. ---
        df = df.loc[:, ~df.columns.str.contains("Unknown_Column")]

        # --- STEP 16: Save the cleaned dataset. ---
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"✅ Cleaned dataset saved to: {output_path}")

    except Exception as e:
        print(f"❌ Error processing file: {e}")


def get_latest_csv(directory):
    """
    Returns the path to the most recent CSV file in the given directory.
    """
    csv_files = [f for f in os.listdir(directory) if f.lower().endswith(".csv")]
    if not csv_files:
        return None
    csv_files.sort(key=lambda f: os.path.getmtime(os.path.join(directory, f)), reverse=True)
    return os.path.join(directory, csv_files[0])


if __name__ == "__main__":
    # Define base directories
    base_dir = os.path.expanduser("~/Desktop/demographic-tool")
    data_raw_dir = os.path.join(base_dir, "data_raw")
    data_cleaned_dir = os.path.join(base_dir, "data_cleaned")
    old_data_raw_dir = os.path.join(base_dir, "old_data_raw")
    
    # Ensure old_data_raw directory exists.
    if not os.path.exists(old_data_raw_dir):
        os.makedirs(old_data_raw_dir)

    # Get the latest CSV file from data_raw.
    latest_file = get_latest_csv(data_raw_dir)
    if latest_file is None:
        print("❌ No CSV files found in data_raw.")
        exit()

    # Determine new filename: replace '_raw' with '_clean', or append '_clean' if '_raw' isn't in the name.
    raw_filename = os.path.basename(latest_file)
    if "_raw" in raw_filename:
        new_filename = raw_filename.replace("_raw", "_clean")
    else:
        new_filename = raw_filename.replace(".csv", "_clean.csv")
    output_path = os.path.join(data_cleaned_dir, new_filename)

    # Define the path to municipios_regions.csv
    municipios_regions_path = os.path.join(base_dir, "municipios_regions.csv")

    # Clean the latest file
    clean_ine_data(latest_file, output_path, municipios_regions_path)

    # Move the raw file to the old_data_raw folder (so it won't be processed again)
    destination_raw = os.path.join(old_data_raw_dir, raw_filename)
    shutil.move(latest_file, destination_raw)
    print(f"📁 Moved raw file to: {destination_raw}")
