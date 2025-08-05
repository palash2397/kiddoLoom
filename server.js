import express from 'express';
import  "dotenv/config.js"
import {connectDB} from './config/db.js';
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from "path";



// ✅ Connect to DB
connectDB();

//
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Initialize Express app
const port = process.env.PORT || 5001;
const app = express();


// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view')); 

// ✅ Static files
app.use("/api/v1",express.static("public"))


// ✅ Routes
import rootRouter from './routes/root.routes.js';
app.use("/api/v1", rootRouter);


app.get('/', (req, res) => {
  res.send('Hello World!');
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})




