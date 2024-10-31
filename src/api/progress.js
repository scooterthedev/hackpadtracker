const mysql = require('mysql');

const db = mysql.createConnection({
  host: '9burt.h.filess.io',
  user: 'PRTracker_telephone',
  password: '9a25926ccb8d15c44c2dee92f217eb21e3fd9712',
  database: 'PRTracker_telephone',
  port: 3307
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

module.exports = (req, res) => {
  if (req.method === 'GET') {
    const pr = req.query.pr;
    db.query('SELECT * FROM PRProgress WHERE PR = ?', [pr], (err, result) => {
      if (err) throw err;
      res.status(200).json(result[0]);
    });
  } else if (req.method === 'POST') {
    const { pr, progress, state } = req.body;
    db.query('INSERT INTO PRProgress (PR, Progress, State) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Progress = ?, State = ?', [pr, progress, state, progress, state], (err, result) => {
      if (err) throw err;
      res.status(200).send('Progress updated');
    });
  } else {
    res.status(405).send('Method Not Allowed');
  }
};