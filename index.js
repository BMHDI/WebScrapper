import express from 'express';
import http from 'http';
import https from 'https';

import * as cheerio from 'cheerio'; 




import axios from 'axios';
  

let linksParsed = {};
// Function to fetch data from API
const fetchData = async (url) => {
    try {
        const response = await axios.get(url);
        const data = response.data; // Adjust based on the structure of your response

        // Map over the results
        data.forEach(link => {
          linksParsed[link.globalid] = {
              title: link.address_desc,
              url: link.home_page?.url,
          };
         
           
        });
        
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
 
};

// Replace with your API endpoint
// const apiUrl = 'https://data.calgary.ca/resource/ggxk-g2u3.json';
// fetchData(apiUrl).then(() => {
//     console.log('Data fetched successfully');
//     console.log(linksParsed);
// });


// console.log(linksParsed);







const app = express();
const PORT = 3000;





// Helper function to fetch HTML using native modules


function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client
            .get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(data);
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

// Function to clean the data
function cleanData(text) {
    return text.replace(/.*: /, '').trim(); // Removes everything up to and including ": "
}

// Endpoint to handle URL input and parse the table
app.get('/parse', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        // Parse the table
        const parkingRates = [];

        $('table.cui.striped.normal-view tbody tr').each((i, el) => {
            const period = cleanData($(el).find('td').eq(0).text());
            const hours = cleanData($(el).find('td').eq(1).text());
            const rate = cleanData($(el).find('td').eq(2).text());
            const max = cleanData($(el).find('td').eq(3).text());

            parkingRates.push({ period, hours, rate, max });
        });

        const result = { parkingRates };

        console.log(result); // Log the parsed data
        res.json(result); // Send the result as JSON
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch or parse the page' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
