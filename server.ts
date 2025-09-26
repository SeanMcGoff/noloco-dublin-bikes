import express from 'express';
import { getFieldTypeFromValues } from './src/field_types';
import { camelCase }from 'lodash';

const app = express();
const port = 3000;

app.get('/schema', (req, res) => {
  // Load json data from file
  const data = require('./data/dublin-bikes.json');

  if (!Array.isArray(data)) {
    return res.status(500).json({ error: 'Expected data to be an array' });
  }

  const fieldValues: Record<string, any[]> = {};

  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    for (const [key, value] of Object.entries(item)) {
      if (!fieldValues[key]) fieldValues[key] = [];
      fieldValues[key].push(value);
    }
  }

  const fields = Object.entries(fieldValues).map(([display, values]) => {
    const [typeName, options] = getFieldTypeFromValues(values);
    return {
      display,
      name: camelCase(display),
      type: (typeName ?? "UNKNOWN"),
      options: options ?? [],
    };
  });

  // TODO: check for duplicate field entries and merge (e.g. "address" and "name")

  res.json({
    fields
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});