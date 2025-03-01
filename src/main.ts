import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});