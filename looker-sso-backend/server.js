// server.js

// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
// Import NodeSettings along with the SDK
const { LookerNodeSDK, NodeSettings } = require('@looker/sdk-node');

// --- Verifying Environment Variables at Startup ---
console.log("--- Verifying Environment Variables at Startup ---");
console.log("LOOKER_BASE_URL:", process.env.LOOKER_BASE_URL);
console.log("LOOKER_CLIENT_ID:", process.env.LOOKER_CLIENT_ID);
console.log("LOOKER_CLIENT_SECRET is set:", !!process.env.LOOKER_CLIENT_SECRET);
console.log("---------------------------------------------");

// 2. Initialize Express App
const app = express();

// 3. Middleware Setup
app.use(cors());
app.use(express.json());

// 4. Looker SDK Initialization (with Error Handling)
let sdk;
try {
    // First, create a proper settings object from the environment variables.
    const settings = new NodeSettings({
        base_url: process.env.LOOKER_BASE_URL,
        client_id: process.env.LOOKER_CLIENT_ID,
        client_secret: process.env.LOOKER_CLIENT_SECRET,
    });

    // Then, initialize the SDK with this settings object.
    sdk = LookerNodeSDK.init40(settings);
    console.log("Looker SDK Initialized Successfully.");
} catch (e) {
    console.error('CRITICAL: Looker SDK failed to initialize.', e);
    // We exit the process because the server cannot run without the SDK.
    process.exit(1);
}


// 5. Define Constants
const DASHBOARD_ID = 'EU9MxVoyJiidBm9oCxVVhR'; // Your specific dashboard ID
const SESSION_LENGTH = 3600;

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.status(200).send('Looker SSO Embed Server is running!');
});

// 6. Create the API Endpoint
app.post('/api/get-embed-url', async (req, res) => {
    // This check ensures the SDK was initialized before trying to use it.
    if (!sdk) {
        console.error("SDK not available to handle request.");
        return res.status(500).json({ error: 'Server is not properly configured.' });
    }

    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    const targetUrl = `${process.env.LOOKER_BASE_URL}/embed/dashboards/${DASHBOARD_ID}`;
    console.log('Constructed target_url:', targetUrl);

    const embedParams = {
        target_url: targetUrl,
        session_length: SESSION_LENGTH,
        force_logout_login: true,
        external_user_id: JSON.stringify(username),
        first_name: username.charAt(0).toUpperCase() + username.slice(1),
        last_name: 'User',
        permissions: [
            'see_user_dashboards',
            'see_lookml_dashboards',
            'access_data',
            'see_looks',
        ],
        models: ['data_security_demo'],
        user_attributes: {
            'customer_id_row_level': username,
        },
    };

    try {
        const signedUrl = await sdk.ok(sdk.create_sso_embed_url(embedParams));
        console.log(`Successfully generated embed URL for user: ${username}`);
        res.json({ url: signedUrl.url });
    } catch (error) {
        console.error('Error generating Looker embed URL:', error);
        res.status(500).json({ error: 'Failed to generate embed URL.' });
    }
});

// --- Catch-All Route for Debugging ---
app.use((req, res) => {
    console.log(`Caught an unmatched request for: ${req.method} ${req.path}`);
    res.status(404).send('Endpoint not found.');
});

// 7. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});

