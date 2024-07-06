import React, { useEffect, useState } from 'react';
import styles from '../styles/OpepenGrid.modules.css';
import image1 from '../images/banner/1.png';
import image2 from '../images/banner/2.png';
import image3 from '../images/banner/3.png';
import image4 from '../images/banner/4.png';
import image5 from '../images/banner/5.png';
import image6 from '../images/banner/6.png';
import image7 from '../images/banner/7.png';
import image8 from '../images/banner/8.png';
import image9 from '../images/banner/9.png';
import image10 from '../images/banner/10.png';
import image11 from '../images/banner/11.png';
import image12 from '../images/banner/12.png';

const images = [
  image1, image2, image3, image4, image5, image6,
  image7, image8, image9, image10, image11, image12
];

const OpepenGrid = ({ rows, imageSize, margin }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateImageArray = () => {
    const imageArray = [];
    for (let i = 0; i < rows; i++) {
      const rowImages = [];
      const imageSizeInPx = parseFloat(imageSize.replace('vw', '')) * windowWidth / 100;
      const numImagesInRow = Math.floor(windowWidth / (imageSizeInPx + 12));
      for (let j = 0; j < numImagesInRow; j++) {
        const randomIndex = Math.floor(Math.random() * images.length);
        const direction = Math.random() > 0.5 ? 'clockwise' : 'counterclockwise';
        rowImages.push({
          key: `${i}-${j}`,
          src: images[randomIndex],
          rotation: Math.random() * 360,
          direction: direction
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
              src={image.src}
              alt="Grid"
              className={`rotate-${image.direction}`}
              style={{
                width: `${imageSize}`,
                height: 'auto',
                transform: `rotate(${image.rotation}deg)`,
                margin: `${margin}`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default OpepenGrid;
