#!/usr/bin/env python3
"""
File: fresh_cleaner_dificuldades.py
Location: demographic-tool/scripts/fresh_cleaner_dificuldades.py
Purpose: Clean raw INE data on difficulties/disabilities and prepare it for the demographic tool
"""

import os
import pandas as pd
import re  # For cleaning place names
import shutil  # For moving processed files

def clean_ine_dificuldades_data(file_path, output_path, municipios_regions_path):
    """
    Cleans an INE dificuldades dataset, specifically handling the structure where
    difficulty types are in rows and difficulty degrees are in columns.
    """
    try:
        print(f"Processing: {file_path}")
        
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
        
        # --- STEP 1: First check the raw file structure ---
        with open(file_path, 'r', encoding='ISO-8859-1') as f:
            first_lines = [next(f) for _ in range(12) if f]
            print("\nFirst few lines of raw file:")
            for i, line in enumerate(first_lines):
                print(f"Line {i}: {line.strip()}")
        
        # --- STEP 2: Load dataset, skipping metadata rows ---
        # Based on your file structure, row 10 seems to be where the actual data starts
        header_row = 9  # Row 10 is 0-indexed as 9
        df = pd.read_csv(
            file_path,
            encoding="ISO-8859-1",
            delimiter=";",
            skiprows=header_row,
            dtype=str
        )
        
        # --- STEP 3: Check and remove the "N.º" row if present ---
        # Safely check first cell's value
        if df.shape[0] > 0:
            first_cell = df.iloc[0, 0]
            if isinstance(first_cell, str) and first_cell.strip() == "N.º":
                df = df.iloc[1:].reset_index(drop=True)
                print("Removed 'N.º' row")
        
        # --- STEP 4: Rename first column and inspect columns ---
        if df.shape[1] > 0:
            df.rename(columns={df.columns[0]: "Place of Residence"}, inplace=True)
            print("\nColumns after initial load:", df.columns.tolist())
            print("\nSample data after initial load:")
            print(df.head(3))
        
        # --- STEP 5: Extract header information from row 8 of raw file ---
        # Based on your file, the headers are on row 9 (0-indexed as 8)
        header_info = pd.read_csv(
            file_path,
            encoding="ISO-8859-1",
            delimiter=";",
            skiprows=8,
            nrows=1,
            dtype=str
        )
        
        print("\nHeader row from file:")
        print(header_info.iloc[0].tolist())
        
        # --- STEP 6: Identify degree of difficulty columns ---
        # UPDATED: Now using the correct name for the fourth column
        difficulty_degree_names = [
            "Não tem nenhuma dificuldade",  # Corrected column name
            "Tem alguma dificuldade",
            "Tem muita dificuldade",
            "Não consegue efetuar a ação"
        ]
        
        # Match the difficulty degree columns - now there are 4 of them
        if df.shape[1] >= 10:  # If we have at least 10 columns (6 dimensions + 4 difficulty degrees)
            diff_rename = {}
            for i, name in enumerate(difficulty_degree_names):
                col_index = 6 + i  # Start from column index 6 (7th column, 0-indexed)
                if col_index < df.shape[1]:
                    diff_rename[df.columns[col_index]] = name
            
            # Apply the renames
            df = df.rename(columns=diff_rename)
            print("\nRenamed difficulty degree columns:", diff_rename)
        
        # --- STEP 7: Forward-fill missing values in dimension columns ---
        # First 6 columns are dimensions: Place, Age, Gender, Reference Period, Education, Difficulty Type
        dimension_count = 6  # Based on your file structure
        for i in range(min(dimension_count, df.shape[1])):
            df.iloc[:, i] = df.iloc[:, i].ffill()
        
        # --- STEP 8: Extract the freguesia code ---
        df['freguesia_code'] = df['Place of Residence'].str.extract(r'^(\d+[A-Z]?\d*):')
        df['freguesia_code'] = df['freguesia_code'].fillna('').astype(str)
        
        # --- STEP 9: Clean "Place of Residence" by removing codes ---
        def clean_place_name(name):
            # remove numeric+alpha code + colon from beginning
            cleaned_name = re.sub(r'^(\d+[A-Z]?\d*):\s*', '', str(name))
            # if it has commas, wrap with quotes
            if "," in cleaned_name:
                return f'"{cleaned_name}"'
            return cleaned_name
        
        df['Place of Residence'] = df['Place of Residence'].apply(clean_place_name)
        
        # --- STEP 10: Map municipality & region from the code lookups ---
        df['municipio'] = df['freguesia_code'].map(location_lookup)
        df['region'] = df['freguesia_code'].map(region_lookup)
        
        # Forward-fill region
        df['region'] = df['region'].ffill()
        
        # For region files, set region to match the Place of Residence
        if not df['region'].any():
            df['region'] = df['Place of Residence']
        
        # --- STEP 11: Rename the dimension columns based on standard names ---
        # First column is already renamed to "Place of Residence"
        dimension_names = [
            "Place of Residence",  # Already renamed
            "Age Group",           # Typically the 2nd column
            "Gender",              # Typically the 3rd column
            "Período de referência dos dados",  # 4th column - will be dropped later
            "Nível de escolaridade mais elevado completo",  # 5th column - will be dropped later
            "Tipo de dificuldade"  # 6th column - the type of difficulty
        ]
        
        # Rename only columns that exist
        rename_dict = {}
        for i, name in enumerate(dimension_names):
            if i < len(df.columns) and i > 0:  # Skip first column which is already renamed
                rename_dict[df.columns[i]] = name
        
        # Apply dimension column renames
        df = df.rename(columns=rename_dict)
        
        # --- STEP 12: Drop unnecessary columns ---
        # Remove "Período de referência dos dados", "Nível de escolaridade mais elevado completo",
        # and any unnamed/empty columns
        columns_to_drop = [
            "Período de referência dos dados",
            "Nível de escolaridade mais elevado completo"
        ]
        
        # Also drop any "Unnamed" columns
        for col in df.columns:
            if 'Unnamed' in str(col):
                columns_to_drop.append(col)
        
        print("\nDropping these columns:", [col for col in columns_to_drop if col in df.columns])
        df = df.drop(columns=[col for col in columns_to_drop if col in df.columns], errors='ignore')
        
        # --- STEP 13: Convert numeric degree columns to numbers ---
        # UPDATED: Using the correct column name
        degree_columns = [
            "Não tem nenhuma dificuldade",  # Corrected column name
            "Tem alguma dificuldade",
            "Tem muita dificuldade",
            "Não consegue efetuar a ação"
        ]
        
        for col in degree_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                # Convert to int if there are no decimal values
                if (df[col] % 1 == 0).all():
                    df[col] = df[col].astype(int)
        
        # --- STEP 14: Remove leftover metadata rows and empty rows ---
        # 1. Remove rows where crucial columns might be NaN
        df = df[df["Place of Residence"].notna()]
        
        if "Age Group" in df.columns:
            df = df[df["Age Group"].notna()]
        
        if "Gender" in df.columns:
            df = df[df["Gender"].notna()]
        
        if "Tipo de dificuldade" in df.columns:
            df = df[df["Tipo de dificuldade"].notna()]
        
        # 2. Ensure at least one difficulty column has a non-zero entry
        # This removes rows that don't contain any actual data
        available_degree_columns = [col for col in degree_columns if col in df.columns]
        if available_degree_columns:
            nonzero_mask = (df[available_degree_columns] != 0).any(axis=1)
            df = df[nonzero_mask]
            print(f"Removed {sum(~nonzero_mask)} rows with all zeros in difficulty columns")
        
        # --- STEP 15: Final data inspection ---
        print("\nFinal columns:", df.columns.tolist())
        print("\nFinal data shape:", df.shape)
        print("\nFinal data sample:")
        print(df.head(3))
        print("\nColumn data types:")
        print(df.dtypes)
        
        # --- STEP 16: Save the cleaned dataset ---
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"\n✅ Cleaned dataset saved to: {output_path}")
        
        return True

    except Exception as e:
        print(f"❌ Error processing file: {e}")
        import traceback
        traceback.print_exc()
        return False


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
    data_raw_dir = os.path.join(base_dir, "data_raw_dificuldades")
    data_cleaned_dir = os.path.join(base_dir, "data_cleaned_dificuldades")
    old_data_raw_dir = os.path.join(base_dir, "old_data_raw_dificuldades")
    
    # Ensure directories exist
    for directory in [data_raw_dir, data_cleaned_dir, old_data_raw_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory)

    # Get the latest CSV file from data_raw.
    latest_file = get_latest_csv(data_raw_dir)
    if latest_file is None:
        print("❌ No CSV files found in data_raw_dificuldades.")
        exit()

    # Determine new filename
    raw_filename = os.path.basename(latest_file)
    if "_raw" in raw_filename:
        new_filename = raw_filename.replace("_raw", "_clean")
    else:
        new_filename = raw_filename.replace(".csv", "_clean.csv")
    output_path = os.path.join(data_cleaned_dir, new_filename)

    # Define the path to municipios_regions.csv
    municipios_regions_path = os.path.join(base_dir, "municipios_regions.csv")

    # Clean the latest file
    success = clean_ine_dificuldades_data(latest_file, output_path, municipios_regions_path)

    # Move the raw file to the old_data_raw folder only if processing was successful
    if success:
        destination_raw = os.path.join(old_data_raw_dir, raw_filename)
        shutil.move(latest_file, destination_raw)
        print(f"📁 Moved raw file to: {destination_raw}")
    else:
        print(f"⚠️ Did not move the raw file since processing failed.")