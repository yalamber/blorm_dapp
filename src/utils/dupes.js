const fs = require('fs');

// Load the JSON file
const data = fs.readFileSync('predefinedColors.json', 'utf8');

// Parse the JSON into an object
let colors = JSON.parse(data);

// Create a new object to store the unique colors
let uniqueColors = {};

// Iterate over each color in the original object
for (let color in colors) {
  // If the color is not already in the uniqueColors object, add it
  if (!uniqueColors.hasOwnProperty(color)) {
    uniqueColors[color] = colors[color];
  }
}

// Stringify the object back into JSON
const uniqueColorsJson = JSON.stringify(uniqueColors, null, 2);

// Save the JSON back into the file
fs.writeFileSync('predefinedColors.json', uniqueColorsJson);