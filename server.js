const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/easyslip', async (req, res) => {
  try {
    const response = await fetch('https://api.easyslip.com/api/v1/slips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 7429373f-1df5-4389-bc3c-2fbc25f5b34d' // 👈 ใช้ Bearer Token
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 EasySlip Proxy Server is running at http://localhost:${PORT}`);
});
