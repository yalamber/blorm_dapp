import React from 'react';
import '../styles/OpepenGrid.modules.css';

const OpepenGrid = ({ rows, imageSize }) => {
  const imageSrc = `opepen-bw.png`;

  // Generate an array of arrays for rows and images
  const generateImageArray = () => {
    const imageArray = [];
    for (let i = 0; i < rows; i++) {
      const rowImages = [];
      const numImagesInRow = Math.floor(window.innerWidth / (imageSize + 6)); // Account for margins
      for (let j = 0; j < numImagesInRow; j++) {
        rowImages.push({
          key: `${i}-${j}`,
          rotation: Math.random() * 360 // Generate random rotation
        });
      }
      imageArray.push(rowImages);
    }
    return imageArray;
  };

  const imageArray = generateImageArray();

  return (
    <div className="image-grid">
      {imageArray.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map(image => (
            <img
              key={image.key}
              src={imageSrc}
              alt="Grid"
              style={{
                width: `${imageSize}px`,
                height: 'auto',
                transform: `rotate(${image.rotation}deg)`,
                margin: '3px'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default OpepenGrid;
