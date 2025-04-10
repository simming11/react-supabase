// easyslipProxy.js
import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

router.post('/create-slip', async (req, res) => {
    try {
        const response = await fetch('https://api.easyslip.com/api/v1/slips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '7429373f-1df5-4389-bc3c-2fbc25f5b34d'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'EasySlip error' });
        }

        return res.json(data);
    } catch (err) {
        console.error('EasySlip Proxy Error:', err);
        return res.status(500).json({ error: 'Server error calling EasySlip' });
    }
});

export default router;
