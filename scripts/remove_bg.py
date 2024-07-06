import cv2
import numpy as np
import os

def remove_white_background(image_path, output_path):
    # Read the image
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    # Check if the image has an alpha channel
    if image.shape[2] == 3:
        # Add an alpha channel if it doesn't have one
        image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Create a binary mask where white areas are 1 and the rest is 0
    _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)

    # Invert the mask to get white background as 0 and the rest as 1
    mask = cv2.bitwise_not(mask)

    # Split the image into its color channels including alpha channel
    b, g, r, a = cv2.split(image)

    # Set the alpha channel to be the inverted mask
    a = cv2.bitwise_and(a, mask)

    # Merge the channels back
    result = cv2.merge([b, g, r, a])

    # Save the result
    cv2.imwrite(output_path, result)

def process_directory(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            image_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            remove_white_background(image_path, output_path)


# Set your input and output directories
input_dir = '/Users/jeffyyu/Downloads/blorm-logo-frames'
output_dir = '/Users/jeffyyu/Downloads/blorm-logo-frames/finals'

# Process all images in the input directory
process_directory(input_dir, output_dir)
