const Tour = require('./../modals/tourModel');
exports.getOverview = async (req, res, next) => {
  // 1. Get the tour data from collection
  const tours = await Tour.find();

  // 2. Build the template

  // 3. Render that template using the tour data from step 1st
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
};

exports.getTour = async (req, res, next) => {
  // 1. Get the tour based on the request
  const tour = await Tour.findOne({ slug: req.params.slug });

  // 2. Build the template

  // 3. Render the template using the tour data from the step 1st
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
    tour,
  });
};

exports.getLoginForm = async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignupForm = async (req, res) => {
  res.status(200).render('signup', {
    title: 'Signup Now!',
  });
};
