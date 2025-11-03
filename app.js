const path = require('path');
const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');
const compression = require('compression');
// console.log(process.env.NODE_ENV);

const app = express();

app.use(cookieParser());

// Setting our template engien for server-side rendering of the website

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(compression());
// Test Middleware
app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});
// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
