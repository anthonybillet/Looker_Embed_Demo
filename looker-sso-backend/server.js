// server.js

// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
// Import NodeSettings along with the SDK
const { LookerNodeSDK, NodeSettings } = require('@looker/sdk-node');

// --- Verifying Environment Variables at Startup ---
// NOTE: We are now checking for the correct LOOKERSDK_ prefix.
console.log("--- Verifying Environment Variables at Startup ---");
console.log("LOOKERSDK_BASE_URL:", process.env.LOOKERSDK_BASE_URL);
console.log("LOOKERSDK_CLIENT_ID:", process.env.LOOKERSDK_CLIENT_ID);
console.log("LOOKERSDK_CLIENT_SECRET is set:", !!process.env.LOOKERSDK_CLIENT_SECRET);
console.log("---------------------------------------------");

// 2. Initialize Express App
const app = express();

// 3. Middleware Setup
app.use(cors());
app.use(express.json());

// 4. Looker SDK Initialization (Final Corrected Version)
// Based on the documentation, this is the correct way to have the SDK
// automatically read from the properly named environment variables.
let sdk;
try {
    // This tells the SDK to look for LOOKERSDK_ environment variables.
    sdk = LookerNodeSDK.init40();
    console.log("Looker SDK Initialized Successfully.");
} catch (e) {
    console.error('CRITICAL: Looker SDK failed to initialize.', e);
    process.exit(1); // Exit if SDK fails
}


// 5. Define Constants
const DASHBOARD_ID = 'external_data_model::data_security_shared_template_dashboard'; // Your specific dashboard ID
const SESSION_LENGTH = 3600;

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.status(200).send('Looker SSO Embed Server is running!');
});

// 6. Create the API Endpoint
app.post('/api/get-embed-url', async (req, res) => {
    if (!sdk) {
        console.error("SDK not available to handle request.");
        return res.status(500).json({ error: 'Server is not properly configured.' });
    }

    // --- CHANGE #1: Destructure 'theme' from the request body ---
    const { username, theme } = req.body;

    if (!username || !theme) {
        return res.status(400).json({ error: 'Username and theme are required.' });
    }

    // --- CHANGE #2: Append the theme to the targetUrl as a query parameter ---
    const targetUrl = `${process.env.LOOKERSDK_BASE_URL}/embed/dashboards/${DASHBOARD_ID}?theme=${theme}`;
    console.log('Constructed target_url:', targetUrl);

    const embedParams = {
        target_url: targetUrl,
        session_length: SESSION_LENGTH,
        force_logout_login: true,
        external_user_id: JSON.stringify(username),
        first_name: username.charAt(0).toUpperCase() + username.slice(1),
        last_name: 'User',
        permissions: [
                    "access_data",
                    "see_looks",
                    "see_user_dashboards",
                    "see_lookml_dashboards",
                    "download_with_limit",
                    "schedule_look_emails",
                    "schedule_external_look_emails",
                    "create_alerts",
                    "see_drill_overlay",
                    "save_content",
                    "embed_browse_spaces",
                    "schedule_look_emails",
                    "send_to_sftp",
                    "send_to_s3",
                    "send_outgoing_webhook",
                    "send_to_integration",
                    "download_without_limit",
                    "explore",
                    "see_sql",
                ],
        models: ['data_security_demo'],
        user_attributes: {
            'customer_id_row_level': username,
        },
    };

    try {
        const signedUrl = await sdk.ok(sdk.create_sso_embed_url(embedParams));
        console.log(`Successfully generated embed URL for user: ${username} with theme: ${theme}`);
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

