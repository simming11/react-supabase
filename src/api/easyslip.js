// /api/easyslip.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
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
        return res.status(response.status).json(data);
      }
  
      return res.status(200).json(data);
    } catch (error) {
      console.error('EasySlip Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  