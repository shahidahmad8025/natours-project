import { showAlert } from './alerts.js';

const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        // email: email,
        // password: password
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // showAlert('error', err.response.data.message);
  }
};

const signUpForm = document.querySelector('.signup-form');

if (signUpForm) {
  signUpForm.addEventListener('submit', (e) => {
    // console.log(document.querySelector('.form'));
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
  });
}
// if (logoutBtn) logoutBtn.addEventListener('click', logout);
