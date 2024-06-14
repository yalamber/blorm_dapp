import React, { useState, useRef, useEffect } from 'react';
import nlp from 'compromise';
import predefinedColors from '../utils/predefinedColors.json';
import styles from '../styles/Blint.module.css';
import UploadToIPFS from '../components/UploadToIPFS.js'; // Import the UploadToIPFS component

const layers = [
    { id: 'layer1', label: 'Layer 1 (background)', type: 'gradient' },
    { id: 'layer2', label: 'Layer 2 (base)', src: '/2-base.png' },
    { id: 'layer4', label: 'Layer 4 (mid)', src: '/4-mid.png' },
    { id: 'layer5', label: 'Layer 5 (top)', src: '/5-top.png' },
];

// Convert hex color to RGB array
const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

// Calculate Euclidean distance between two RGB colors
const colorDistance = (rgb1, rgb2) => {
    return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
    );
};

// Utility function to clamp values between 0 and 255
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Utility function to generate a random integer within a range
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to sample a random color within ±10 RGB values
const sampleRandomShade = (rgb) => {
    return [
        clamp(rgb[0] + getRandomInt(-10, 10), 0, 255),
        clamp(rgb[1] + getRandomInt(-10, 10), 0, 255),
        clamp(rgb[2] + getRandomInt(-10, 10), 0, 255)
    ];
};

// Convert RGB array to hex color
const rgbArrayToHex = (rgb) => {
    return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

// Find the closest matching color
const getClosestColor = (inputColor) => {
    if (!inputColor) return rgbArrayToHex([255, 255, 255]);

    // Use regex to extract color-related terms, considering multi-word colors
    const colorTerms = inputColor.match(/\b(?:\w+ ?)+\b/g);

    // Check for exact matches first
    for (const term of colorTerms) {
        const lowerTerm = term.trim().toLowerCase();
        if (lowerTerm in predefinedColors) {
            const colorRgb = predefinedColors[lowerTerm].rgb;
            const randomShade = sampleRandomShade(colorRgb);
            return rgbArrayToHex(randomShade);
        }
    }

    // If no exact match found, perform Euclidean distance search
    let closestColor = { name: null, distance: Infinity };

    for (const [name, color] of Object.entries(predefinedColors)) {
        const distance = colorDistance(hexToRgb(predefinedColors[name].hex), hexToRgb(inputColor));
        if (distance < closestColor.distance) {
            closestColor = { name, distance };
        }
    }

    const colorRgb = predefinedColors[closestColor.name].rgb;
    const randomShade = sampleRandomShade(colorRgb);
    return rgbArrayToHex(randomShade);
};

const Blint = () => {
    const [backgroundColor, setBackgroundColor] = useState('');
    const [gradientColors, setGradientColors] = useState({
        primary: '',
        secondary: '',
    });
    const [visibility, setVisibility] = useState({
        layer2: true,
        layer4: true,
        layer5: true,
    });
    const [backgroundPlaceholder, setBackgroundPlaceholder] = useState('');
    const [gradientPlaceholder, setGradientPlaceholder] = useState('');
    const [gradientPlaceholder2, setGradientPlaceholder2] = useState('');
    const canvasRef = useRef(null);
    const [canvasDataURL, setCanvasDataURL] = useState('');

    useEffect(() => {
        const randomPlaceholderColor = () => {
            const colorNames = Object.keys(predefinedColors);
            return colorNames[Math.floor(Math.random() * colorNames.length)];
        };

        setBackgroundPlaceholder(randomPlaceholderColor());
        setGradientPlaceholder(randomPlaceholderColor());
        setGradientPlaceholder2(randomPlaceholderColor());
    }, []);

    const handleChangeBackgroundColor = (color) => {
        setBackgroundColor(getClosestColor(color));
    };

    const handleChangeGradientColor = (type, color) => {
        const closestColor = getClosestColor(color);
        if (type === 'primary') {
            setGradientColors((prevColors) => ({
                ...prevColors,
                primary: closestColor,
            }));
        } else {
            setGradientColors((prevColors) => ({
                ...prevColors,
                secondary: closestColor,
            }));
        }
    };

    const toggleVisibility = (layerId) => {
        setVisibility((prevVisibility) => ({
            ...prevVisibility,
            [layerId]: !prevVisibility[layerId],
        }));
    };

    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Handle CORS if images are hosted externally
            img.onload = () => {
                console.log(`Image loaded: ${src}`);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    };

    const rgbToHex = (r, g, b) => {
        const toHex = (value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const adjustColor = (color, amount) => {
        return Math.max(Math.min(color + amount, 255), 0);
    };

    const generateGradientColors = (baseColor) => {
        const rgb = hexToRgb(baseColor);
        const primaryColor = rgbToHex(
            adjustColor(rgb[0], 10),
            adjustColor(rgb[1], 10),
            adjustColor(rgb[2], 10)
        );
        const secondaryColor = rgbToHex(
            adjustColor(rgb[0], -10),
            adjustColor(rgb[1], -10),
            adjustColor(rgb[2], -10)
        );
        return { primaryColor, secondaryColor };
    };

    const applyGradientMap = (imageData, primaryColor, secondaryColor) => {
        const data = imageData.data;
        const primary = hexToRgb(primaryColor);
        const secondary = hexToRgb(secondaryColor);

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha === 0) continue; // Skip transparent pixels

            const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
            const t = grayscale / 255;

            data[i] = Math.round(primary[0] * (1 - t) + secondary[0] * t);
            data[i + 1] = Math.round(primary[1] * (1 - t) + secondary[1] * t);
            data[i + 2] = Math.round(primary[2] * (1 - t) + secondary[2] * t);
        }

        return imageData;
    };

    const drawStars = (ctx) => {
        const starCount = getRandomInt(1, 5);
        const starImage = new Image();
        starImage.src = '/whitestar2.png'; // Use the uploaded star image
        starImage.onload = () => {
            for (let i = 0; i < starCount; i++) {
                const x = getRandomInt(0, ctx.canvas.width);
                const y = getRandomInt(0, ctx.canvas.height);
                const angle = getRandomInt(0, 360);
                const size = getRandomInt(50, 100); // Adjust the min and max values as needed for star sizes
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((angle * Math.PI) / 180);
                ctx.drawImage(starImage, -size / 2, -size / 2, size, size); // Adjusted to include width and height
                ctx.restore();
            }
        };
    };

    const renderLayers = async (ctx) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (!backgroundColor || !gradientColors.primary || !gradientColors.secondary) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Create a separate canvas for each layer
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = ctx.canvas.width;
        offscreenCanvas.height = ctx.canvas.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        // Draw the gradient for the background layer
        const { primaryColor: bgPrimaryColor, secondaryColor: bgSecondaryColor } = generateGradientColors(backgroundColor);
        const gradient = offscreenCtx.createLinearGradient(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        gradient.addColorStop(0, bgPrimaryColor);
        gradient.addColorStop(1, bgSecondaryColor);
        offscreenCtx.fillStyle = gradient;
        offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);

        // Draw and apply gradient maps to other layers
        for (const layer of layers.slice(1)) { // Skip the background layer
            if (!visibility[layer.id]) continue; // Skip layers that are not visible
            try {
                const img = await loadImage(layer.src);
                offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                offscreenCtx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
                let adjustedImageData;
                if (layer.id === 'layer2' || layer.id === 'layer4') {
                    // Apply primary gradient to layers 2 and 4
                    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    const { primaryColor, secondaryColor } = generateGradientColors(gradientColors.primary);
                    adjustedImageData = applyGradientMap(imageData, primaryColor, secondaryColor);
                    offscreenCtx.putImageData(adjustedImageData, 0, 0);
                } else if (layer.id === 'layer5') {
                    // Apply secondary gradient to layer 5
                    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    const { primaryColor, secondaryColor } = generateGradientColors(gradientColors.secondary);
                    adjustedImageData = applyGradientMap(imageData, primaryColor, secondaryColor);
                    offscreenCtx.putImageData(adjustedImageData, 0, 0);
                }
                ctx.drawImage(offscreenCanvas, 0, 0);
            } catch (error) {
                console.error(`Error rendering layer ${layer.id}:`, error);
            }
        }

        // Draw stars on the canvas
        drawStars(ctx);

        // Update the canvas data URL
        setCanvasDataURL(canvas.toDataURL('image/png'));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            renderLayers(ctx);
        }
    }, [backgroundColor, gradientColors, visibility]);

    const setInputWidth = (input) => {
        const placeholderText = input.placeholder;
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.fontSize = getComputedStyle(input).fontSize;
        tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
        tempSpan.textContent = placeholderText;

        document.body.appendChild(tempSpan);
        const placeholderWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        input.style.width = `${Math.max(input.scrollWidth, placeholderWidth)}px`;
    };

    const handleResize = (event) => {
        const input = event.target;
        input.style.width = '1px';
        setInputWidth(input);
    };

    useEffect(() => {
        const randomPlaceholderColor = () => {
            const colorNames = Object.keys(predefinedColors);
            return colorNames[Math.floor(Math.random() * colorNames.length)];
        };

        setBackgroundPlaceholder(randomPlaceholderColor());
        setGradientPlaceholder(randomPlaceholderColor());

        const inputs = document.querySelectorAll(`.${styles.input}`);
        inputs.forEach(input => {
            setInputWidth(input);
        });
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.titleContainer}>
                <h1 className={styles.title}>B L I N T</h1>
            </div>
            <div>
                <p className={styles.sentence}>
                    I want to mint a
                    <input
                        type="text"
                        placeholder={gradientPlaceholder}
                        onBlur={(e) => {
                            handleChangeGradientColor('primary', e.target.value);
                            handleResize(e);
                        }}
                        onInput={handleResize}
                        className={styles.input}
                    /> and
                    <input
                        type="text"
                        placeholder={gradientPlaceholder2}
                        onBlur={(e) => {
                            handleChangeGradientColor('secondary', e.target.value);
                            handleResize(e);
                        }}
                        onInput={handleResize}
                        className={styles.input}
                    /> Opepen with a
                    <input
                        type="text"
                        placeholder={backgroundPlaceholder}
                        onBlur={(e) => {
                            handleChangeBackgroundColor(e.target.value);
                            handleResize(e);
                        }}
                        onInput={handleResize}
                        className={styles.input}
                    /> background.
                </p>
            </div>
            <canvas ref={canvasRef} width={500} height={500} />
            {canvasDataURL && <UploadToIPFS base64String={canvasDataURL} />} {/* Pass the canvas data URL */}
        </div>
    );
};

export default Blint;
