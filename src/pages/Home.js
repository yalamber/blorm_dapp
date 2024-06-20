import React, { useState, useEffect, useRef } from 'react';
import frames from '../utils/ascii_frames_with_blorm.json'; // Adjust the path as necessary
import styles from '../styles/Home.module.css';
import { Link } from 'react-router-dom';

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState([]);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const [fontSize, setFontSize] = useState(10);
  const speed = 100; // Adjust this value for animation speed (in milliseconds)

  // Function to calculate and resize ASCII art based on viewport dimensions
  const resizeAsciiArt = (frame, width) => {
    const lines = frame.split('\n');
    const newLines = lines.map(line => line.padEnd(width, ' '));
    return newLines.join('\n');
  };

  useEffect(() => {
    // Function to handle resizing ASCII art frames
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // const containerHeight = containerRef.current.clientHeight;
        // const aspectRatio = containerHeight / containerWidth;
        const fontSize = containerWidth / 375; // Adjust this value for font size
        setFontSize(fontSize);
        const width = Math.floor(containerWidth / fontSize);
        // const height = Math.floor(containerHeight / fontSize / aspectRatio);
        const resizedFrames = frames.map(frame => ({
          ...frame,
          background: resizeAsciiArt(frame.background, width),
        }));
        setAsciiFrames(resizedFrames);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const animate = () => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % asciiFrames.length);
      animationRef.current = setTimeout(animate, speed);
    };

    if (asciiFrames.length > 0) {
      animationRef.current = setTimeout(animate, speed);
    }

    return () => clearTimeout(animationRef.current);
  }, [speed, asciiFrames.length]);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.background}>
        <pre className={styles.pre} style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize}px` }}>
          {asciiFrames[currentIndex]?.background}
        </pre>
      </div>
      <div className={styles.titleContainer}>
        {/*<h1 className={styles.title}>B L O R M</h1>*/}
      </div>
      <Link to="/blint">
        <button className={styles.actionButton}>
          B L I N T →
        </button>
      </Link>
    </div>
  );
};

export default Home;
