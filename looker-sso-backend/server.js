// server.js

// 1. Import Dependencies
require('dotenv').config(); // Loads environment variables from a .env file
const express = require('express');
const cors = require('cors');
const { LookerNodeSDK } = require('@looker/sdk-node');

// 2. Initialize Express App
const app = express();
const port = 3000;

// 3. Middleware Setup
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON requests

// 4. Looker SDK Initialization
// Automatically uses environment variables: LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET
const sdk = LookerNodeSDK.init40();

// 5. Define Constants
// const DASHBOARD_ID = '1'; // <<< IMPORTANT: REPLACE '1' WITH YOUR ACTUAL DASHBOARD ID
const SESSION_LENGTH = 3600; // Session length in seconds (e.g., 3600 = 1 hour)

// 6. Create the API Endpoint
app.post('/api/get-embed-url', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    const targetUrl = `https://7d9da728-3eaf-4944-965c-d1d56538803c.looker.app/embed/dashboards/EU9MxVoyJiidBm9oCxVVhR`;
    
    // --- ADDED FOR DEBUGGING ---
    // This line will print the fully constructed URL to your terminal.
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
            // The key ('brand' in this case) must match the name of the User Attribute in Looker.
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

// 7. Start the Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

