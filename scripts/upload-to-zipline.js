#!/usr/bin/env node

/**
 * Zipline Upload Script for VPN Exit Controller Raycast Extension
 * Uploads release archives to Zipline for distribution
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Zipline configuration
const ZIPLINE_URL = 'https://zipline.rbnk.uk';
const ZIPLINE_TOKEN = process.env.ZIPLINE_TOKEN || 'MTc1NDMzODk1MTA4MQ==.MWEyOGRmM2I0ODlhMDU1OWIwMWU0ZDUyNzYwZTQ0NzIuOTU3Yzc2ZDQ5OGRiOTRlN2I2MTI0MGJjMmQ0NWFhYjAxODU2Y2E2MWFlNjU2YWE5YTc2ZDlmOTM4N2YzYmI2ZmNkZWU3NDFmMGQxOGZmYmY5MjNhZmE2OWI5OTE0NzJjMTg5ZjI5N2U1NTNhYjhjZTBhYjFkNDMyN2RjZDVlY2Q2MjE5OGM3MTA1NDRlODNjMWZhMTlhYzM4Njg0NGJkMA==';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: upload-to-zipline.js <file-path> [version]');
  process.exit(1);
}

const filePath = args[0];
const version = args[1] || 'latest';

// Validate file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

// Get file stats
const stats = fs.statSync(filePath);
const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

// Upload file to Zipline
async function uploadFile(filePath) {
  try {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    
    // Add file to form
    form.append('file', fileStream, {
      filename: fileName,
      contentType: 'application/gzip'
    });

    // Import node-fetch dynamically (ES module)
    const fetch = (await import('node-fetch')).default;

    // Make upload request
    const response = await fetch(`${ZIPLINE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZIPLINE_TOKEN}`,
        'x-zipline-original-name': 'true',
        ...form.getHeaders()
      },
      body: form
    });

    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    // Parse response
    const result = await response.json();
    
    if (result.files && result.files.length > 0) {
      const uploadedFile = result.files[0];
      return uploadedFile.url;
    } else {
      throw new Error('No file URL returned from upload');
    }

  } catch (error) {
    console.error('Upload error:', error.message);
    process.exit(1);
  }
}

// Display upload information
console.log(`Uploading ${path.basename(filePath)} (${fileSizeInMB} MB) to Zipline...`);

// Perform upload
uploadFile(filePath)
  .then(url => {
    console.log(url); // Output only the URL for script consumption
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to upload:', error.message);
    process.exit(1);
  });