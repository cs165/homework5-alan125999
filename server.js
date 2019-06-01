const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1jIDk5xpxRqBeLvZs3X1G3KKk9eSYTOlUEVh6go4nbcI';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);

  // TODO(you): Finish onGet.
  const [ titles, contents ] = splitResult(result);

  const list = contents.map(row => {
    const entity = {};
    titles.forEach((title, index) => {
      entity[title] = row[index];
    });
    return entity;
  });
  res.json( list );
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;

  // TODO(you): Implement onPost.
  const result = await sheet.getRows();
  const [ titles, contents ] = splitResult(result);

  const newRow = [];
  titles.forEach(title => {
    const key = Object.keys(messageBody).find(k => k.toLowerCase() === title.toLowerCase());
    newRow.push(messageBody[key]);
  });
  const ret = await sheet.appendRow(newRow);
  if(ret.response === 'success') res.json( { status: 'success'} );
  else res.json( { status: 'error', message: ret.error} );
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;

  // TODO(you): Implement onPatch.
  const result = await sheet.getRows();
  const [ titles, contents ] = splitResult(result);
  const colIndex = titles.findIndex(title => title.toLowerCase() === column.toLowerCase());
  const rowIndex = contents.findIndex(row => row[colIndex].toLowerCase() === value.toLowerCase());
  if(rowIndex !== -1) {
    const row = contents[rowIndex];
    for(const [key, value] of Object.entries(messageBody)) row[titles.findIndex(title => title.toLowerCase() === key.toLowerCase())] = value;
    const ret = await sheet.setRow(rowIndex + 1, row);
    if(ret.response !== "success") {
      res.json( { status: 'error', message: ret.error } );
      return;
    }
  }
  res.json( { status: 'success'} );
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;

  // TODO(you): Implement onDelete.
  const result = await sheet.getRows();
  const [ titles, contents ] = splitResult(result);

  const colIndex = titles.findIndex(title => title.toLowerCase() === column.toLowerCase());
  if(colIndex !== -1) {
    const rowIndex = contents.findIndex(row => row[colIndex].toLowerCase() === value.toLowerCase());
    if(rowIndex !== -1) {
      const ret = await sheet.deleteRow(rowIndex + 1);
      if(ret.response !== "success") {
        res.json( { status: 'error', message: ret.error } );
        return;
      }
    }
  }
  res.json( { status: 'success'} );
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});

function splitResult(result) {
  const { rows } = result;
  return [ rows[0], rows.slice(1) ];
}