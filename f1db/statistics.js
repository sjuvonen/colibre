exports.configure = async (services) => {
  this.db = await services.get('database.f1db');
}

exports.index = (request, view) => {
  let a = this.db.query('SELECT DISTINCT year FROM races ORDER BY year');
  let b = this.db.query(`
    SELECT DISTINCT a.id, a.first_name, a.last_name, d.id team_id, d.name team_name
    FROM drivers a
      INNER JOIN race_results b
        ON a.id = b.driver_id
      INNER JOIN races c
        ON b.race_id = c.id
      INNER JOIN teams d
        ON b.team_id = d.id
    WHERE c.year = (SELECT MAX(year) FROM races)
    ORDER BY team_name, a.last_name, a.first_name
  `);

  return Promise.all([a, b]).then(([years, drivers]) => {
    let v = view('f1db/index', {
      years: years.map(r => r.year),
      drivers
    });

    return v;
  });
}
