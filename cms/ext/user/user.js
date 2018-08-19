exports.configure = (services) => {
  this.authenticator = services.get('user.authenticator');
  this.manager = services.get('user.manager');
};

exports.login = (request, view) => {
  return view('user/login');
};

exports.register = async (request, view) => {
  let form_data = request.body;
  try {
    await this.authenticator.validateRegistration(form_data);
    let user = await this.manager.createAccount(form_data);

    console.log('VALID', user, user.__data);

    return view('user/register');
  } catch (error) {
    console.error(error);

    return view('user/register');
  }
};
