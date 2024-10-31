import mysql from "mysql";

const db = mysql.createConnection({
  host: '9burt.h.filess.io',
  user: 'PRTracker_telephone',
  password: '9a25926ccb8d15c44c2dee92f217eb21e3fd9712',
  database: 'PRTracker_telephone',
  port: 3307
});

db.connect(function (err) {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    throw err;
  }
  console.log('MySQL connected...');
});

module.exports = (req, res) => {
  console.log(`Received ${req.method} request for PR: ${req.query.pr || req.body.pr}`);

  if (req.method === 'GET') {
    const pr = req.query.pr;
    console.log('Fetching progress for PR:', pr);
    db.query('SELECT * FROM PRProgress WHERE PR = ?', [pr], (err, result) => {
      if (err) {
        console.error('Error fetching progress:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log('Progress fetched:', result[0]);
      res.status(200).json(result[0]);
    });
  } else if (req.method === 'POST') {
    const { pr, progress, state } = req.body;
    console.log('Updating progress for PR:', pr, 'with progress:', progress, 'and state:', state);
    db.query('INSERT INTO PRProgress (PR, Progress, State) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Progress = ?, State = ?', [pr, progress, state, progress, state], (err, result) => {
      if (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log('Progress updated for PR:', pr);
      res.status(200).send('Progress updated');
    });
  } else {
    console.warn('Method not allowed:', req.method);
    res.status(405).send('Method Not Allowed');
  }
};