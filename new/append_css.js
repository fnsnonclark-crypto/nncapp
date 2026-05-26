const fs = require('fs');
const path = require('path');
const appendFile = path.join(__dirname, 'assets', 'css', 'append.css');
const styleFile = path.join(__dirname, 'assets', 'css', 'style.css');

const appendContent = fs.readFileSync(appendFile, 'utf8');
fs.appendFileSync(styleFile, '\n' + appendContent);
console.log('Appended css successfully');
