import express from 'express';

const app = express();
const port = 3000;

app.get('/hello', (_req: any, res: { send: (arg0: string) => void; }) => {
  res.send('Hello');
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});