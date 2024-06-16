import json
from PIL import Image, ImageSequence

# Function to read the ASCII text from the file
def read_ascii_text(file_path):
    with open(file_path, 'r') as file:
        return file.read()

# Function to convert image to ASCII
def image_to_ascii(image, width=1000):
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

# Function to process the GIF and save to JSON
def process_gif(gif_path, text_path, output_file):
    ascii_text = read_ascii_text(text_path)
    with Image.open(gif_path) as img:
        frames = []
        for frame in ImageSequence.Iterator(img):
            ascii_frame = image_to_ascii(frame)
            ascii_frame_with_text = overlay_text_on_frame(ascii_frame, ascii_text)
            frames.append({"background": ascii_frame_with_text})
        
        with open(output_file, 'w') as file:
            json.dump(frames, file, indent=4)

# Paths
gif_path = '../src/utils/waves.gif'  # Ensure the GIF file path is correct
text_path = '../src/utils/blormLogoASCII.txt'  # Ensure the text file path is correct
output_file = '../src/utils/ascii_frames_with_blorm.json'

# Process the GIF
process_gif(gif_path, text_path, output_file)

print(f"Output saved to {output_file}")
