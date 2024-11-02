import axios from 'axios';
import http from 'http';
import https from 'https';
import * as cheerio from 'cheerio'; 

let linksParsed = {};

// Function to fetch HTML from a URL
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

// Function to clean data text
function cleanData(text) {
    return text.trim().replace(/\n/g, '').replace(/\s+/g, ' ');
}

// Function to fetch data from the API and process each link
const fetchData = async (url) => {
    try {
        const response = await axios.get(url);
        const data = response.data;

        // Map over the results and parse each link's HTML
        for (const link of data) {
            if (!link.globalid || !link.home_page?.url) {
                console.warn(`Skipping entry with missing globalid or URL: ${JSON.stringify(link)}`);
                continue; // Skip entries without a globalid or valid URL
            }

            // Initialize linksParsed with parkingRates as an array
            linksParsed[link.globalid] = {
                title: link.address_desc,
                url: link.home_page.url,
                parkingRates: []
            };

            try {
                const html = await fetchHtml(link.home_page.url);
                const $ = cheerio.load(html);

                $('table.cui.striped.normal-view tbody tr').each((i, el) => {
                    const period = cleanData($(el).find('td').eq(0).text());
                    const hours = cleanData($(el).find('td').eq(1).text());
                    const rate = cleanData($(el).find('td').eq(2).text());
                    const max = cleanData($(el).find('td').eq(3).text());

                    // Push each row as an object to parkingRates array
                    linksParsed[link.globalid].parkingRates.push({ period, hours, rate, max });
                console.log(linksParsed[link.globalid].parkingRates);
                  });

            } catch (err) {
                console.error(`Error fetching HTML from ${link.home_page.url}:`, err.message);
            }
        }

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
};

// Replace with your API endpoint
const apiUrl = 'https://data.calgary.ca/resource/ggxk-g2u3.json';
fetchData(apiUrl).then(() => {
    console.log('Data fetched successfully');
    console.log(JSON.stringify(linksParsed)); // Log the final data with parking rates
});
