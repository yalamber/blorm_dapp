import json
import ffmpeg
from PIL import Image
import os

# Function to read the ASCII text from the file
def read_ascii_text(file_path):
    with open(file_path, 'r') as file:
        return file.read()

# Function to convert image to ASCII
def image_to_ascii(image, width=192*7):
    gray_image = image.convert("L")
    height = int((gray_image.height / gray_image.width) * width)
    resized_image = gray_image.resize((width, height))

    ascii_chars = "@%#*+=-:. "
    ascii_image = ""
    for y in range(resized_image.height):
        for x in range(resized_image.width):
            pixel = resized_image.getpixel((x, y))
            ascii_image += ascii_chars[pixel // 32]
        ascii_image += "\n"
    return ascii_image

# Function to overlay ASCII text onto a frame
def overlay_text_on_frame(frame, text, padding=2):
    frame_lines = frame.split('\n')
    text_lines = text.split('\n')

    # Calculate the starting position for the overlay
    start_y = (len(frame_lines) - len(text_lines)) // 2
    max_line_length = max(len(line) for line in frame_lines)
    text_max_length = max(len(line) for line in text_lines)
    start_x = (max_line_length - text_max_length) // 2

    # Create a new frame with padding
    padded_frame_lines = []
    for _ in range(padding):
        padded_frame_lines.append(" " * max_line_length)
    
    for i, line in enumerate(text_lines):
        new_line = (
            " " * start_x + line + " " * (max_line_length - start_x - len(line))
        )
        padded_frame_lines.append(new_line)
    
    for _ in range(padding):
        padded_frame_lines.append(" " * max_line_length)

    # Combine the padded frame lines into a single string
    padded_frame = "\n".join(padded_frame_lines)

    # Overlay the padded text onto the frame
    start_y = (len(frame_lines) - len(padded_frame_lines)) // 2
    for i, line in enumerate(padded_frame_lines):
        frame_y = start_y + i
        if 0 <= frame_y < len(frame_lines):
            frame_lines[frame_y] = line
    
    return "\n".join(frame_lines)

# Function to extract frames from MP4 using ffmpeg
def extract_frames(mp4_path, output_folder):
    ffmpeg.input(mp4_path).output(os.path.join(output_folder, 'frame_%04d.png')).run()

# Function to process the frames and save to JSON
def process_frames(frame_folder, text_path, output_file):
    ascii_text = read_ascii_text(text_path)
    frames = []
    
    frame_files = sorted([f for f in os.listdir(frame_folder) if f.endswith('.png')])
    
    for frame_file in frame_files:
        frame_path = os.path.join(frame_folder, frame_file)
        image = Image.open(frame_path)
        
        ascii_frame = image_to_ascii(image)
        ascii_frame_with_text = overlay_text_on_frame(ascii_frame, ascii_text)
        
        frames.append({"background": ascii_frame_with_text})
    
    with open(output_file, 'w') as file:
        json.dump(frames, file, indent=4)

# Paths
mp4_path = '../src/utils/cubes.mp4'  # Ensure the MP4 file path is correct
frame_folder = '../src/utils/frames'  # Folder to store extracted frames
text_path = '../src/utils/blormLogoASCII.txt'  # Ensure the text file path is correct
output_file = '../src/utils/ascii_frames_with_blorm.json'

# Create frame folder if it doesn't exist
if not os.path.exists(frame_folder):
    os.makedirs(frame_folder)

# Extract frames from MP4
extract_frames(mp4_path, frame_folder)

# Process the frames
process_frames(frame_folder, text_path, output_file)

print(f"Output saved to {output_file}")
