export default async function handler(req, res) {
    if (req.method === 'POST') {
        const data = req.body; // This is the data sent by Zapier
        console.log('Received data:', data);

        res.status(200).json({ success: true });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
