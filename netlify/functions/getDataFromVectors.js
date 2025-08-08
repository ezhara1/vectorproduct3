// Using native fetch API available in Node.js 18+

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the request body
        const requestData = JSON.parse(event.body);
        console.log('Received request data:', requestData);

        // Statistics Canada API endpoint
        const apiUrl = 'https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods';

        // Make the request to Statistics Canada API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            console.error('Statistics Canada API error:', response.status, response.statusText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Statistics Canada API returned ${response.status}: ${response.statusText}` 
                })
            };
        }

        // Get the response data
        const data = await response.json();
        console.log('Statistics Canada API response received');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error in getDataFromVectors function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
