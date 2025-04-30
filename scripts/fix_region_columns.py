import os
import pandas as pd
import re

def fix_region_columns(file_path):
    """
    Function to fix region files by:
    1. Extracting and preserving the region code in the freguesia_code column
    2. Cleaning the Place of Residence column to remove numeric codes
    3. Setting region column to the cleaned Place of Residence
    4. Setting empty string for municipio
    """
    try:
        print(f"Processing: {file_path}")
        
        # Load the file
        df = pd.read_csv(file_path)
        
        # Extract region code (first part before the colon)
        # This preserves the original code format which we'll use to distinguish region vs municipio vs freguesia
        df['freguesia_code'] = df['Place of Residence'].str.extract(r'^([\dA-Z]+):').fillna('')
        
        # Clean the Place of Residence column to remove codes like "1A0: "
        def clean_place_name(name):
            # Remove numeric/alphanumeric code + colon from beginning
            cleaned_name = re.sub(r'^[\dA-Z]+:\s*', '', str(name))
            return cleaned_name
        
        # Clean the Place of Residence column
        df['Place of Residence'] = df['Place of Residence'].apply(clean_place_name)
        
        # Set the region column to match the cleaned Place of Residence
        df['region'] = df['Place of Residence']
        
        # Set empty string for municipio
        df['municipio'] = ""
        
        # Print sample rows to verify
        print("\nSample of processed rows:")
        print(df[['Place of Residence', 'freguesia_code', 'region']].head(3))
        
        # Save the updated file
        df.to_csv(file_path, index=False)
        
        print(f"✅ Updated {file_path} - Preserved original region codes in freguesia_code")
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        import traceback
        traceback.print_exc()

def process_region_folder(folder_path):
    """
    Process all CSV files in a folder
    """
    if not os.path.exists(folder_path):
        print(f"❌ Folder not found: {folder_path}")
        return
    
    csv_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.csv')]
    
    if not csv_files:
        print(f"No CSV files found in {folder_path}")
        return
    
    print(f"Found {len(csv_files)} CSV file(s) in {folder_path}")
    
    for csv_file in csv_files:
        file_path = os.path.join(folder_path, csv_file)
        fix_region_columns(file_path)

# Base directory
base_dir = os.path.expanduser("~/Desktop/demographic-tool")

# Region folders
region_nationality_folder = os.path.join(base_dir, "regions", "nationality")
region_education_folder = os.path.join(base_dir, "regions", "education")
region_dificuldades_folder = os.path.join(base_dir, "regions", "dificuldades")

# Process each folder
print("Processing nationality region data...")
process_region_folder(region_nationality_folder)

print("\nProcessing education region data...")
process_region_folder(region_education_folder)

print("\nProcessing difficulties/disabilities region data...")
process_region_folder(region_dificuldades_folder)

print("\nAll region files processed!")