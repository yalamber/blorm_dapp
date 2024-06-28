const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-fb.json');
const cors = require('cors')({ origin: true });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.createCustomToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    console.log('Request received:', req.body);
    const { walletAddress } = req.body;

    if (!walletAddress) {
      console.error('Missing wallet address');
      return res.status(400).send({ error: 'The function must be called with a wallet address.' });
    }

    try {
      const customToken = await admin.auth().createCustomToken(walletAddress);
      console.log('Custom token created:', customToken);
      res.send({ token: customToken });
    } catch (error) {
      console.error('Error creating custom token:', error);
      res.status(500).send({ error: 'Unable to create custom token' });
    }
  });
});
