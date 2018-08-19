exports.configure = (services) => {
  this.db = services.get('database');
};


// exports.collection = (request, view) => new Promise((resolve) => {
//   // setTimeout(() => resolve(view('foobar.html.twig')), 400);
// });

exports.collection = (request, view) => {
  return view('content/collection');
};

exports.view = () => {
  return 'view content';
};

exports.add = () => {
  return 'add content';
};

exports.edit = () => {
  return 'edit content';
};

exports.delete = () => {
  return 'delete content';
};
