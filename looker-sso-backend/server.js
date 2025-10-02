// server.js

// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
// Import NodeSettings to be more specific about our configuration source
const { LookerNodeSDK, NodeSettings } = require('@looker/sdk-node');

// --- NEW DEBUGGING STEP ---
// Log the environment variables as soon as the server starts.
// This will show us exactly what values the container is receiving from the GCP environment.
console.log("--- Verifying Environment Variables at Startup ---");
console.log("LOOKER_BASE_URL:", process.env.LOOKER_BASE_URL);
console.log("LOOKER_CLIENT_ID:", process.env.LOOKER_CLIENT_ID);
// For security, we only check if the secret exists, we don't print its value.
console.log("LOOKER_CLIENT_SECRET is set:", !!process.env.LOOKER_CLIENT_SECRET);
console.log("---------------------------------------------");

// 2. Initialize Express App
const app = express();

// 3. Middleware Setup
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON requests

// 4. Looker SDK Initialization (Corrected for Cloud Run)
// This tells the SDK to ONLY use environment variables for configuration,
// preventing it from trying to find a non-existent .ini file.
const sdk = LookerNodeSDK.init40(NodeSettings.fromEnv());


// 5. Define Constants
const DASHBOARD_ID = 'EU9MxVoyJiidBm9oCxVVhR'; // Your specific dashboard ID
const SESSION_LENGTH = 3600; // Session length in seconds (e.g., 3600 = 1 hour)

// 6. Create the API Endpoint
app.post('/api/get-embed-url', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    // Construct the target URL dynamically using the environment variable and constant.
    const targetUrl = `https://7d9da728-3eaf-4944-965c-d1d56538803c.looker.app/embed/dashboards/EU9MxVoyJiidBm9oCxVVhR`;
    
    console.log('Constructed target_url:', targetUrl);

    // These are the parameters for the SSO embed URL.
    const embedParams = {
        target_url: targetUrl,
        session_length: SESSION_LENGTH,
        force_logout_login: true,
        external_user_id: JSON.stringify(username), // Must be a unique JSON string
        first_name: username.charAt(0).toUpperCase() + username.slice(1),
        last_name: 'User',
        permissions: [ // Define what the embed user can do.
            'see_user_dashboards',
            'see_lookml_dashboards',
            'access_data',
            'see_looks',
        ],
        models: ['data_security_demo'], // <<< IMPORTANT: REPLACE WITH YOUR LOOKML MODEL NAME(S)
        user_attributes: {
            // This is where you pass the user attribute to filter the data.
            'customer_id_row_level': username,
        },
    };

    try {
        // Ask the Looker SDK to create the signed URL.
        const signedUrl = await sdk.ok(sdk.create_sso_embed_url(embedParams));
        console.log(`Successfully generated embed URL for user: ${username}`);
        // Send the generated URL back to the front-end.
        res.json({ url: signedUrl.url });
    } catch (error) {
        console.error('Error generating Looker embed URL:', error);
        res.status(500).json({ error: 'Failed to generate embed URL.' });
    }
});

// 7. Start the Server (Updated for Cloud Run)
// Cloud Run provides the PORT environment variable. We default to 3000 for local development.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});

