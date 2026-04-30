const http = require('http');
const https = require('https');

// We need to fetch from the backend via http/https. Let's send a fake minimal request to the backend that should trigger the PDF generation and show the 500 error.
// We just need to know the port. Let's find it in launchSettings.json first.
