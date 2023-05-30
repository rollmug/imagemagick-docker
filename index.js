import express from "express";
import chalk from "chalk";
import * as dotenv from 'dotenv';
dotenv.config();
import path from "path";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = express();
const port = process.env.PORT || 5100;

const debug = require('debug')('app');
const morgan = require('morgan');

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

import index from "./src/routers/index.js";
app.use('/', index);

app.listen(port, () => {
    debug(chalk.greenBright(`Server running on port ${port}`));
});