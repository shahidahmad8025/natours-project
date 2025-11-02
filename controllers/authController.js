const { promisify } = require('util');
const User = require('./../modals/userModel');
const jwt = require('jsonwebtoken');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

// Function for creating jwt signature
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Function for calling signToken function and sending response to the client
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
      photo: req.body.photo,
    });
    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide email and password',
    });
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'fail',
      message: 'email or password is incorrect',
    });
  }
  createSendToken(user, 200, res);
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
// Creating protect middleware for protecting routes from unauthorized acccess

exports.protect = async (req, res, next) => {
  // 1. Getting the token

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // console.log(token);

    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in. Please log in first',
    });
  }

  // 2. Verifying the token

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // console.log(decoded);

    // 3. Check if user still exists

    const currentUser = await User.findById(decoded.id);

    // console.log(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist',
      });
    }
    // 4. Check if user changed password after token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'User recently changed password. Please Log in again',
      });
    }

    // Transferring current user data to another middleware using the request object, for future requirement of it

    req.user = currentUser;
    // console.log('req.user', req.user);
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: err.message,
    });
  }
  // Grant access to the protected route

  next();
};
exports.isLoggedIn = async (req, res, next) => {
  // 1. Verifying the token

  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET_KEY);

      // 2. Check if user still exists

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      // 3. Check if user changed password after token was issued

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // This is a logged in user

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide'].
    // role = 'user' => not in the array.
    if (!roles.includes(req.user.role)) {
      console.log(req.user);
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1. Get the user based on posted email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'There is no user with this email address',
    });
  }

  // 2. Generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: 
  ${resetURL}.\n If you didn't forgot your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(valid for 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: 'error',
      message: 'There was an error sending the email. Try again later!',
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1. Get the user based on the token

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2. If token has not expired, and there is user, set the new password

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or it has expired',
      });
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3. Update changedPasswordAt property for the user

    // 4. Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  // 1. Get the user from collection
  const user = await User.findById(req.user.id).select('+password');
  // console.log(user);
  // 2. Check if the current posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return res.status(401).json({
      status: 'fail',
      message: 'Your current password is wrong',
    });
  }
  // 3. If the current password is currect, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
};
