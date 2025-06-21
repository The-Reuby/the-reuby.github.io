import subprocess
import os
import glob
import sys

def convert_pdf_to_png(pdf_path, dpi=300):
    # Extract the base name without extension
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Create output directory
    output_dir = base_name
    os.makedirs(output_dir, exist_ok=True)
    
    # Run pdftoppm command to generate PNGs in the output directory
    output_prefix = os.path.join(output_dir, base_name)
    subprocess.run(['pdftoppm', '-png', '-r', str(dpi), pdf_path, output_prefix], check=True)

    # Find generated files and sort them
    generated_files = sorted(glob.glob(f"{output_prefix}-*.png"))

    # Rename them to zero-padded format
    for i, file in enumerate(generated_files):
        new_name = os.path.join(output_dir, f"{i:03}.png")
        os.rename(file, new_name)
        print(f"Renamed {os.path.basename(file)} -> {os.path.basename(new_name)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert2png.py <pdf_file>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    
    if not os.path.exists(pdf_file):
        print(f"Error: File '{pdf_file}' not found.")
        sys.exit(1)
    
    if not pdf_file.lower().endswith('.pdf'):
        print("Error: Please provide a PDF file.")
        sys.exit(1)
    
    try:
        print(f"Converting {pdf_file} to PNG images...")
        convert_pdf_to_png(pdf_file)
        print("Conversion completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

# how to use:
# python convert2png.py file-name.pdf