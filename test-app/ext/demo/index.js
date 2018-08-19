
exports.routes = [
  {
    path: '/',
    name: 'front',
    controller: 'demo.front',
  },
  {
    path: '/demo',
    name: 'demo',
    controller: 'demo.hello',
  }
];

exports.controllers = {
  demo: {
    front() {
      console.log('INDEX');
      return 'FRONT PAGE HERE!';
    },
    hello() {
      console.log('HELLO');
      return 'HELLO TO YOU';
    }
  }
}

exports.configure = (services) => {
  // console.log('configure demo');
};
