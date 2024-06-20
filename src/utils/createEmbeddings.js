const fs = require('fs');
const predefinedColors = require('./predefinedColors.json');

const generateEmbeddings = async () => {
    const transformers = await import('@xenova/transformers');
    const pipeline = transformers.pipeline;
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = false;

    try {
        console.log('Loading model and generating embeddings...');
        const modelName = 'Xenova/bert-base-uncased'; // Ensure this is the correct model name
        const loadedModel = await pipeline('feature-extraction', modelName);

        console.log('Model loaded successfully. Generating color embeddings...');
        const colorNames = Object.keys(predefinedColors);
        const embeddings = {};
        const targetLength = 768;

        for (const colorName of colorNames) {
            const embedding = await loadedModel(colorName, { pooling: 'mean', normalize: true });
            let embeddingArray;

            if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
                // Check if embedding is in shape [1, targetLength]
                embeddingArray = embedding[0];
            } else if (embedding && embedding.tolist) {
                embeddingArray = embedding.tolist()[0];
            } else if (embedding && embedding.arraySync) {
                embeddingArray = embedding.arraySync()[0];
            } else if (embedding && embedding.dims && embedding.data instanceof Float32Array) {
                embeddingArray = Array.from(embedding.data);
            } else {
                throw new Error(`Unexpected embedding format for ${colorName}`);
            }

            // Pad or truncate the embedding to ensure it has the target length
            if (embeddingArray.length > targetLength) {
                embeddingArray = embeddingArray.slice(0, targetLength);
            } else if (embeddingArray.length < targetLength) {
                embeddingArray = [...embeddingArray, ...new Array(targetLength - embeddingArray.length).fill(0)];
            }

            embeddings[colorName] = embeddingArray;
        }

        // Write embeddings to file
        fs.writeFileSync('src/utils/colorEmbeddings.json', JSON.stringify(embeddings, null, 2));

        console.log('Embeddings saved to colorEmbeddings.json');
    } catch (error) {
        console.error('Error loading model or generating embeddings:', error);
    }
};

generateEmbeddings();
