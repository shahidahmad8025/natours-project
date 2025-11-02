const mongoose = require('mongoose');
const Tour = require('./../../modals/tourModel');
const fs = require('fs');
const dotenv = require('dotenv');
if (process.env.NODE_ENV !== 'production') dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB Connection Successful!'));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// Importing dev data into DB

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data loaded successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Deleting all data in the collection

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data deleted succcessfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// console.log('process.argv', process.argv);
