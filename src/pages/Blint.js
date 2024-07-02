import React, { useState, useRef, useEffect, useMemo } from 'react';
import BlintDisplayMessage from '../components/BlintDisplayMessage';
import * as tf from '@tensorflow/tfjs';
import predefinedColors from '../utils/predefinedColors.json';
import colorEmbeddings from '../utils/colorEmbeddings.json';
import styles from '../styles/Blint.module.css';
import UploadToIPFS from '../utils/UploadToIPFS.js';
import { checkBase64Exists, addBase64ToFirestore } from '../utils/firestoreUtils.js';
import { mintToken } from '../utils/mintToken.js';
import FuzzySet from 'fuzzyset.js';
import BlintCongrats from '../components/BlintCongrats.js';
import OpepenGrid from '../components/OpepenGrid.js';
import Navbar from '../components/Navbar.js';
import { useAuth } from '../context/AuthContext';
import ChainDropdown from '../components/ChainDropdown.js';
import LoadingAscii from '../components/LoadingAscii.js';

const layers = [
    { id: 'layer1', label: 'Layer 1 (background)', type: 'gradient' },
    { id: 'layer2', label: 'Layer 2 (base)', src: '/2-base.png' },
    { id: 'layer4', label: 'Layer 4 (mid)', src: '/4-mid.png' },
    { id: 'layer5', label: 'Layer 5 (top)', src: '/5-top.png' },
];

const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const colorDistance = (rgb1, rgb2) => {
    return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
    );
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const sampleRandomShade = (rgb) => {
    return [
        clamp(rgb[0] + getRandomInt(-10, 10), 0, 255),
        clamp(rgb[1] + getRandomInt(-10, 10), 0, 255),
        clamp(rgb[2] + getRandomInt(-10, 10), 0, 255)
    ];
};

const rgbArrayToHex = (rgb) => {
    return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

const Blint = () => {
    const { user, walletAddress, profile, handleLogin } = useAuth();
    const [showModal, setShowModal] = useState(false);

    const [displayMessage, setDisplayMessage] = useState([]);
    const [showCongrats, setShowCongrats] = useState(false);

    const [loading, setLoading] = useState(false);

    const getClosestColor = async (inputColor) => {
        if (!inputColor) {
            return rgbArrayToHex([255, 255, 255]);  // Default color if no input
        }

        // Check if the color exists in the predefined colors JSON
        if (predefinedColors[inputColor]) {
            const colorRgb = predefinedColors[inputColor].rgb;
            const randomShade = sampleRandomShade(colorRgb);
            return rgbArrayToHex(randomShade);
        }

        // Implement typo correction using FuzzySet
        const fuzzyColors = FuzzySet(Object.keys(predefinedColors));
        const fuzzyResult = fuzzyColors.get(inputColor);
        if (fuzzyResult && fuzzyResult[0][0] > 0.7) { // Adjust threshold as needed
            inputColor = fuzzyResult[0][1];
        }

        // If the color doesn't exist, find the closest match
        if (inputColor && typeof inputColor === 'string') {
            const inputEmbeddingArray = colorEmbeddings[inputColor];

            let minDistance = Infinity;
            let bestMatch = null;
            for (const [name, embedding] of Object.entries(colorEmbeddings)) {
                if (Array.isArray(inputEmbeddingArray) && Array.isArray(embedding)) {
                    // Ensure the shapes are compatible before subtraction
                    if (inputEmbeddingArray.length === embedding.length) {
                        try {
                            const inputTensor = tf.tensor(inputEmbeddingArray);
                            const embeddingTensor = tf.tensor(embedding);

                            const distance = tf.norm(tf.sub(inputTensor, embeddingTensor)).dataSync()[0];

                            inputTensor.dispose(); // Dispose of the input tensor
                            embeddingTensor.dispose(); // Dispose of the embedding tensor

                            if (distance < minDistance) {
                                minDistance = distance;
                                bestMatch = name;
                            }
                        } catch (error) {
                            console.error("Error comparing embeddings:", error);
                        }
                    }
                }
            }

            if (bestMatch) {
                const colorRgb = predefinedColors[bestMatch].rgb;
                const randomShade = sampleRandomShade(colorRgb);
                return rgbArrayToHex(randomShade);
            }
        }

        return rgbArrayToHex([255, 255, 255]);  // Default color if no match found
    };

    const [tokenUrl, setTokenUrl] = useState('');

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
    const [backgroundPlaceholder, setBackgroundPlaceholder] = useState('w');
    const [gradientPlaceholder, setGradientPlaceholder] = useState('');
    const [gradientPlaceholder2, setGradientPlaceholder2] = useState('');
    const canvasRef = useRef(null);
    const [canvasDataURL, setCanvasDataURL] = useState('');
    const [uploadUrl, setUploadUrl] = useState('');
    const [checkResult, setCheckResult] = useState('');
    const [addResult, setAddResult] = useState('');

    const inputRefs = useRef({});

    useEffect(() => {
        const randomPlaceholderColor = () => {
            const colorNames = Object.keys(predefinedColors);
            return colorNames[Math.floor(Math.random() * colorNames.length)];
        };
        const randomColorBackground = randomPlaceholderColor();
        const randomColorGradient = randomPlaceholderColor();
        const randomColorGradient2 = randomPlaceholderColor();
        setBackgroundPlaceholder(randomColorBackground);
        setGradientPlaceholder(randomColorGradient);
        setGradientPlaceholder2(randomColorGradient2);

        // Set initial width for each input after a short delay to ensure elements are rendered
        setTimeout(() => {
            Object.values(inputRefs.current).forEach(input => {
                if (input) {
                    adjustInputWidth(input);
                }
            });
        }, 100);
    }, []);

    const adjustInputWidth = (input) => {
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.fontSize = getComputedStyle(input).fontSize;
        tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
        if (input.value) {
            tempSpan.textContent = input.value;
        } else {
            tempSpan.textContent = input.placeholder;
        }

        document.body.appendChild(tempSpan);
        const width = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);
        input.style.width = `${width + 20}px`; // Added 10 pixels to the calculated width
        input.style.marginRight = '0.5rem';
    };

    const handleInputChange = (event) => {
        const input = event.target;
        adjustInputWidth(input);
    };


    const handleInputBlur = (event, callback) => {
        const input = event.target;
        callback(input.value);
        adjustInputWidth(input);
    };

    const handleChangeBackgroundColor = async (color) => {
        const closestColor = await getClosestColor(color);
        setBackgroundColor(closestColor);
    };

    const handleChangeGradientColor = async (type, color) => {
        const closestColor = await getClosestColor(color);
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

    const [metadata, setMetadata] = useState({});
    const [starCount, setStarCount] = useState(0);
    const [recipientAddress, setRecipientAddress] = useState('');

    const updateMetadata = () => {
        const newMetadata = {
            name: `BLOP`, // Increment this based on your logic
            description: `BLOP. The first algorithmic art collection curated by Blorm.`,
            image: '', // This will be set after uploading to IPFS
            attributes: [
                {
                    trait_type: 'Primary Color',
                    value: gradientColors.primary
                },
                {
                    trait_type: 'Secondary Color',
                    value: gradientColors.secondary
                },
                {
                    trait_type: 'Background Color',
                    value: backgroundColor
                },
                {
                    trait_type: 'Stars',
                    value: starCount
                },
                {
                    trait_type: 'Edition',
                    value: 'Common' // Increment this based on your logic
                }
            ],
            creator: 'Blorm',
            motto: 'Form Blockchain Information',
            collection: 'BLOP',
            external_url: 'https://blorm.xyz'
        };
        setMetadata(newMetadata);
    };

    useEffect(() => {
        updateMetadata();
    }, [backgroundColor, gradientColors, starCount]);

    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => {
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
            if (alpha === 0) continue;

            const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
            const t = grayscale / 255;

            data[i] = Math.round(primary[0] * (1 - t) + secondary[0] * t);
            data[i + 1] = Math.round(primary[1] * (1 - t) + secondary[1] * t);
            data[i + 2] = Math.round(primary[2] * (1 - t) + secondary[2] * t);
        }

        return imageData;
    };

    const drawStars = (ctx) => {
        const count = getRandomInt(1, 5);
        setStarCount(count);
        const starImage = new Image();
        starImage.src = '/whitestar2.png';
        starImage.onload = () => {
            for (let i = 0; i < count; i++) {
                const x = getRandomInt(0, ctx.canvas.width);
                const y = getRandomInt(0, ctx.canvas.height);
                const angle = getRandomInt(0, 360);
                const size = getRandomInt(50, 100);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((angle * Math.PI) / 180);
                ctx.drawImage(starImage, -size / 2, -size / 2, size, size);
                ctx.restore();
            }
        };
    };

    const renderLayers = async (ctx) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (!backgroundColor || !gradientColors.primary || !gradientColors.secondary) {
            console.error('Missing color values for rendering layers');
            return;
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = ctx.canvas.width;
        offscreenCanvas.height = ctx.canvas.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        const { primaryColor: bgPrimaryColor, secondaryColor: bgSecondaryColor } = generateGradientColors(backgroundColor);
        const gradient = offscreenCtx.createLinearGradient(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        gradient.addColorStop(0, bgPrimaryColor);
        gradient.addColorStop(1, bgSecondaryColor);
        offscreenCtx.fillStyle = gradient;
        offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);

        for (const layer of layers.slice(1)) {
            if (!visibility[layer.id]) continue;
            try {
                const img = await loadImage(layer.src);
                offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                offscreenCtx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
                let adjustedImageData;
                if (layer.id === 'layer2' || layer.id === 'layer4') {
                    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    const { primaryColor, secondaryColor } = generateGradientColors(gradientColors.primary);
                    adjustedImageData = applyGradientMap(imageData, primaryColor, secondaryColor);
                    offscreenCtx.putImageData(adjustedImageData, 0, 0);
                } else if (layer.id === 'layer5') {
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

        drawStars(ctx);
        setCanvasDataURL(canvas.toDataURL('image/png'));
    };

    const isCanvasEmpty = (canvas) => {
        const ctx = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
    };

    const renderCanvas = () => {
        if (!backgroundColor || !gradientColors.primary || !gradientColors.secondary) {
            setDisplayMessage([...displayMessage, { message: 'Please fill in all colors.', type: 'error' }]);
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            renderLayers(ctx);

            // Check if the canvas is empty after rendering
            const isEmpty = isCanvasEmpty(canvas);
            setIsCanvasValid(!isEmpty);

            if (!isEmpty) {
                setCanvasDataURL(canvas.toDataURL('image/png'));
            } else {
                setCanvasDataURL('');
            }
        }
    };



    const [successTxHash, setSuccessTxHash] = useState('');
    const [successTokenId, setSuccessTokenId] = useState('');
    const [openseaURL, setOpenseaURL] = useState('');
    const [selectedChain, setSelectedChain] = useState('');

    const handleChainSelection = (chain) => {
        setSelectedChain(chain);
    };

    const clearMessage = (index) => {
        setDisplayMessage((prevMessages) => prevMessages.filter((_, i) => i !== index));
    };

    const [nft, setNft] = useState(null);

    const handleUploadAndMint = async () => {
        if (!user || !walletAddress || !profile) {
            setShowModal(true);
            return;
        }

        if (!gradientColors.primary || !gradientColors.secondary || !backgroundColor || !selectedChain) {
            setDisplayMessage([...displayMessage, { message: 'Please fill in all colors and select a chain.', type: 'error' }]);
            return;
        }

        try {
            setLoading(true);
            setTokenUrl('Loading...');
            const exists = await checkBase64Exists(canvasDataURL);
            if (exists) {
                setDisplayMessage([...displayMessage, { message: 'Looks like this Opepen has been minted already, please generate again!', type: 'error' }]);
                return;
            }

            const uri = await UploadToIPFS(canvasDataURL);
            const updatedMetadata = { ...metadata, image: uri };
            setMetadata(updatedMetadata);

            const txResponse = await mintToken(updatedMetadata, selectedChain);
            const tokenId = txResponse[0];
            const txHash = txResponse[1];
            setSuccessTxHash(txHash);
            if (tokenId === undefined) {
                setDisplayMessage([...displayMessage, { message: 'Failed to get token ID.', type: 'error' }]);
                return;
            }
            setSuccessTokenId(tokenId);

            const addResult = await addBase64ToFirestore(canvasDataURL);
            if (!addResult.success) {
                setDisplayMessage([...displayMessage, { message: 'Failed to add Opepen to Base64 database.', type: 'error' }]);
                return;
            }

            const url = `${selectedChain.opensea}/${selectedChain.contractAddress}/${tokenId}`;
            setOpenseaURL(url);
            setTokenUrl(url);
            setLoading(false);
            setShowCongrats(true);

            // Update nft state with tokenId and metadata
            setNft({ metadata: updatedMetadata, tokenId, chain: selectedChain.name, chainId: selectedChain.chainID });
        } catch (error) {
            setLoading(false);
            console.error('Uploading and minting:', error);
            setDisplayMessage([...displayMessage, { message: 'There was an issue with uploading and minting, Please try again.', type: 'error' }]);
        }
    };


    const testOptions = ['Option 1', 'Option 2', 'Option 3'];

    const OpepenGridTop = useMemo(() => <OpepenGrid rows={2} imageSize={80} />, []);
    const OpepenGridBottom = useMemo(() => <OpepenGrid rows={2} imageSize={80} />, []);

    const handleClose = () => {
        setDisplayMessage([]);
    };

    useEffect(() => {
        if (user && showModal) {
            setShowModal(false);
        }
    }, [user, profile, walletAddress]);

    const [isCanvasValid, setIsCanvasValid] = useState(false);

    const blintAgainClicked = () => {
        setShowCongrats(false);
        setCanvasDataURL('');
        setSuccessTxHash('');
        setSuccessTokenId('');
        setOpenseaURL('');
        setNft(null);
        setStarCount(0);
        setRecipientAddress('');
        setVisibility({
            layer2: true,
            layer4: true,
            layer5: true,
        });
        setGradientColors({
            primary: '',
            secondary: '',
        });
        setBackgroundColor('');
        setMetadata({});
        setTokenUrl('');
        setUploadUrl('');
        setCheckResult('');
        setAddResult('');
        setCanvasDataURL('');
        setDisplayMessage([]);
        setSelectedChain('');
    }

    return (
        <div className={styles.container}>
            <Navbar />
            {displayMessage && displayMessage.length > 0 && (
                <BlintDisplayMessage messages={displayMessage} clearMessage={clearMessage} />
            )}
            {OpepenGridTop}
            {loading ? <LoadingAscii/> : null}
            {showCongrats ? (
                <BlintCongrats
                    txHash={successTxHash}
                    tokenId={successTokenId}
                    openseaURL={openseaURL}
                    nft={nft}
                    blintAgainClicked={blintAgainClicked}
                />
            ) : (
                <div className={styles.middleContainer}>
                    <div className={styles.middleLeftContainer}>
                        <div className={styles.sentence}>
                            <div></div>
                            <div>
                                <span>I want to mint a</span>
                                <input
                                    ref={(el) => (inputRefs.current['primary'] = el)}
                                    type="text"
                                    placeholder={gradientPlaceholder}
                                    onBlur={(e) => handleInputBlur(e, handleChangeGradientColor.bind(null, 'primary'))}
                                    onChange={handleInputChange}
                                    className={styles.colorInput}
                                />
                            </div>
                            <div>
                                <span>and</span>
                                <input
                                    ref={(el) => (inputRefs.current['secondary'] = el)}
                                    type="text"
                                    placeholder={gradientPlaceholder2}
                                    onBlur={(e) => handleInputBlur(e, handleChangeGradientColor.bind(null, 'secondary'))}
                                    onChange={handleInputChange}
                                    className={styles.colorInput}
                                />
                                <span>Opepen</span>
                            </div>
                            <div>
                                <span>with a</span>
                                <input
                                    ref={(el) => (inputRefs.current['background'] = el)}
                                    type="text"
                                    placeholder={backgroundPlaceholder}
                                    onBlur={(e) => handleInputBlur(e, handleChangeBackgroundColor)}
                                    onChange={handleInputChange}
                                    className={styles.colorInput}
                                />
                                <span>background</span>
                            </div>
                            <div className={styles.sentenceChain}>
                                <span className={styles.sentenceChainSpan}>on </span>
                                <ChainDropdown label="Select Chain:" onSelectChain={handleChainSelection} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.canvasContainer}>
                        <div className={styles.canvasInner}>
                            <canvas ref={canvasRef} width={400} height={400} />
                        </div>
                        <div className={styles.buttonsContainer}>
                            <div className={styles.generateButtonContainer}>
                                <button className={styles.actionButton} onClick={renderCanvas}>Generate</button>
                            </div>
                            {isCanvasValid && (
                                <div className={styles.uploadButtonContainer}>
                                    <button className={styles.actionButton} onClick={handleUploadAndMint}>Mint</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Sign in to mint your NFT</h2>
                        <button onClick={handleLogin} className={styles.actionButton}>Sign in</button>
                    </div>
                </div>
            )}
            <div className={styles.bottomContainer}>
                {OpepenGridBottom}
            </div>
        </div>
    );
};

export default Blint;