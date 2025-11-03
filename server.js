const mongoose = require('mongoose');
// const mongodb = require('mongodb');
const dotenv = require('dotenv');
// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
console.log(process.env.NODE_ENV);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on the port ${port}`);
});
