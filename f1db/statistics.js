exports.configure = async (services) => {
  this.db = await services.get('database.f1db');
}

exports.index = (request, view) => {
  return this.db.query('SELECT DISTINCT year FROM races ORDER BY year').then((result) => {
    let v = view('f1db/index', {
      years: result.map(r => r.year)
    });

    return v;
  });
}
