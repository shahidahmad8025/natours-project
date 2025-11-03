const mongoose = require('mongoose');
// const mongodb = require('mongodb');
const dotenv = require('dotenv');
// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', encodeURIComponent(process.env.DATABASE_PASSWORD));
console.log(DB);

// mongoose
//   .connect(DB, {
//     useUnifiedTopology: true,
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//   })
//   .then(() => console.log('DB connection successful!', DB));

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  })
  .catch((err) => {
    console.log('DB connection error:', err);
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on the port ${port}`);
});
