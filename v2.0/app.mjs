import dotenv from 'dotenv';
dotenv.config();

import { WEBHOOK } from './webhook.mjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:" + port.toString() + "/chatible-ubc";


/*----WEBHOOK TO FACEBOOK PAGE----*/
WEBHOOK();
/*--------------------------------*/

/*
UPLOAD MESSAGE

git add .
git commit -m "I'm dying"
git push heroku master

*/