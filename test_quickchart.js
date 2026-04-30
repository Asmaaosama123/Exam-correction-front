const https = require('https');
const fs = require('fs');

const chartConfig = {
  type: "radar",
  data: {
    labels: ["A", "B", "C"],
    datasets: [{
      label: "Test",
      data: [10, 20, 30]
    }]
  },
  options: { maintainAspectRatio: false }
};

const requestBody = JSON.stringify({
  backgroundColor: "white",
  width: 500,
  height: 500,
  format: "png",
  chart: chartConfig
});

const options = {
  hostname: 'quickchart.io',
  port: 443,
  path: '/chart',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  const chunks = [];
  res.on('data', (d) => {
    chunks.push(d);
  });
  
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log(`Size: ${buffer.length}`);
    fs.writeFileSync('test_chart.png', buffer);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(requestBody);
req.end();
