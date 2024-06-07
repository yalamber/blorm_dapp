import React, { useState } from 'react';
import OpenAI from "openai";

const ImageMerger = () => {
    const [mergedImage, setMergedImage] = useState(null);
    const [prompt, setPrompt] = useState('');

    const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

    const generateImageFromDalle = async (prompt) => {
        try {
            console.log('Generating image from DALL-E...')
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
            });
            console.log('Image generated from DALL-E:', response.data[0].b64_json)
            let image_base64 = response.data[0].b64_json;
            return `data:image/png;base64,${image_base64}`;
        } catch (error) {
            console.error('Error generating image from DALL-E:', error);
            return null;
        }
    };

    const loadImageFromBase64 = (base64) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = base64;
        });
    };

    const loadImageFromUrl = (url) => {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.crossOrigin = 'anonymous';

            img.onload = () => resolve(img);

            img.onerror = (err) => reject(err);

            img.src = url;

        });

    };

    const mergeImages = async (baseImageBase64, overlayImageUrl) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; // Adjust size as needed
        canvas.height = 512; // Adjust size as needed
        const ctx = canvas.getContext('2d');

        const baseImage = await loadImageFromBase64(baseImageBase64);
        const overlayImage = await loadImageFromUrl(overlayImageUrl);

        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL();
    };

    const handleGenerateAndMerge = async () => {
        const baseImageBase64 = await generateImageFromDalle(prompt);
        const overlayImageUrl = `${process.env.PUBLIC_URL}/XVI.png`; // Local overlay image

        if (baseImageBase64) {
            const mergedImageUrl = await mergeImages(baseImageBase64, overlayImageUrl);
            setMergedImage(mergedImageUrl);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt"
                style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
            />
            <button onClick={handleGenerateAndMerge}>Generate and Merge Image</button>
            {mergedImage && <img src={mergedImage} alt="Merged" style={{ marginTop: "10px" }} />}
        </div>
    );
};

export default ImageMerger;