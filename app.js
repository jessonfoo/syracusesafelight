const path = require('path');
const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('About.html', (req, res) => {
  res.sendFile(__dirname + '/About.html');
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('App is listening on port', PORT);
});
