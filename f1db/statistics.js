// class Driver {
//   constructor(values) {
//     this.__data = values;
//   }
//
//   get id() {
//     return this.__data.id;
//   }
//
//   get firstName() {
//     return this.__data.first_name;
//   }
//
//   get lastName() {
//     return this.__data.last_name;
//   }
//
//   get nationality() {
//     return this.__data.nationality;
//   }
//
//   get dateOfBirth() {
//     return this.__data.dob;
//   }
// }

const points = require('./points');

exports.configure = async (services) => {
  this.db = await services.get('database.f1db');
}

exports.index = async (request, view) => {
  let a = this.db.distinct().pluck('year').from('races').orderBy('year', 'asc');

  let b = this.db
    .distinct()
    .select('a.id', 'a.first_name', 'a.last_name', this.db.raw('COALESCE(SUM(b.points), 0) points'))
    .from('drivers AS a')
    .join('race_results AS b', 'a.id', 'b.driver_id')
    .join('races AS c', 'b.race_id', 'c.id')
    .whereRaw('c.year = (SELECT max(year) FROM races)')
    .groupBy('a.id')
    .orderBy('points', 'desc');

  let c = this.db
    .distinct()
    .select('a.id', 'a.name', this.db.raw('COALESCE(SUM(b.points), 0) points'))
    .from('teams AS a')
    .join('race_results AS b', 'a.id', 'b.team_id')
    .join('races AS c', 'b.race_id', 'c.id')
    .whereRaw('c.year = (SELECT max(year) FROM races)')
    .groupBy('a.id')
    .orderBy('points', 'desc');

  let [years, drivers, teams] = await Promise.all([a, b, c]);

  return view('f1db/index', {
    years,
    drivers,
    teams
  });
}

exports.driver = async (request, view) => {
  const driver_id = request.params.get('driver');

  let a = this.db.first().from('drivers').where('id', driver_id);
  let b = this.db
    .select('a.name', 'a.year', 'a.round')
    .select('b.grid_position', 'b.position', 'b.points', 'b.finished')
    .select('c.label AS status')
    .from('races AS a')
    .leftJoin('race_results AS b', 'a.id', 'b.race_id')
    .leftJoin('status_codes AS c', 'b.status_id', 'c.id')
    .whereRaw('b.driver_id = ? OR b.driver_id IS NULL', driver_id)
    .orderBy('a.year', 'asc')
    .orderBy('a.round', 'asc')
    ;

  let [driver, races] = await Promise.all([a, b]);
  let seasons = new Map;

  let stats = {
    wins: 0,
    poles: 0,
    podiums: 0,
    races: 0,
  };

  races.forEach((race) => {
    if (!seasons.has(race.year)) {
      seasons.set(race.year, {
        year: race.year,
        races: [race]
      });
    } else {
      seasons.get(race.year).races.push(race);
    }

    if (race.grid_position == 1) {
      stats.poles++;
    }

    if (race.position <= 3) {
      stats.podiums++;

      if (race.position == 1) {
        stats.wins++;
      }
    }

    if (race.position) {
      stats.races++;
    }
  });

  return view('f1db/drivers/profile', {
    driver,
    races,
    stats,
    seasons: [...seasons.values()],
  });
};

exports.team = async (request, view) => {
  const team_id = request.params.get('team');

  let a = this.db.first().from('teams').where('id', team_id);

  let b = this.db
    .select('a.name', 'a.year', 'a.round')
    .select('b.grid_position', 'b.position', 'b.points', 'b.finished')
    .select('c.label AS status')
    .from('races AS a')
    .leftJoin('race_results AS b', 'a.id', 'b.race_id')
    .leftJoin('status_codes AS c', 'b.status_id', 'c.id')
    .whereRaw('b.team_id = ? OR b.team_id IS NULL', team_id)
    .orderBy('a.year', 'asc')
    .orderBy('a.round', 'asc')
    ;

  let [team, races] = await Promise.all([a, b]);


  return view('f1db/teams/profile', {
    team,
  });
};

exports.season = async (request, view) => {
  const year = request.params.get('year');
  const round = request.params.get('round');

  let a = this.db
    .from('season_cumulative_points AS a')
    .where('a.year', year)
    .orderBy('a.driver')
    .orderBy('a.round')
    ;

  if (round > 0) {
    a.where('a.round', '<=', round);
  }

  let [results] = await Promise.all([a]);
  // let standings = points.from_1981_to_1990(results);
  let standings = points.pre_1981(1979, results);

  // console.log(standings);

  return view('f1db/standings', {
    results,
    standings,
  });
};
