const fs = require('fs');
const parse_inner = require('csv-parse/lib/sync');
const massive = require('massive');
const knex = require('knex');

const dirname = __dirname + '/../../f1db.files/dump';

function parse(file) {
  let data = fs.readFileSync(`${dirname}/${file}`);
  let parsed = parse_inner(data, {
    cast: (value, context) => {
      return value == '\\N' ? null : value;
    }
  });
  return parsed;
}

function int2time(ms) {
  if (ms) {
    let decimals = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / 1000) / 60 % 60);
    let hours = Math.floor((ms / 1000) / 3600);
    return `${hours}:${minutes}:${seconds}.${decimals}`;
  }
}

const db = knex({
  client: 'pg',
  connection: {
    database: 'f1db'
  }
});

async function importDrivers() {
  for (let row of parse('driver.csv')) {
    let [id, slug, number, code, first_name, last_name, dob, nationality, url] = row;
    await db('drivers').insert({
      id: parseInt(id),
      first_name,
      last_name,
      nationality,
      dob
    });
  }
}

async function importConstructors() {
  for (let row of parse('constructors.csv')) {
    let [id, slug, name, nationality, url] = row;
    await db('teams').insert({
      id: parseInt(id),
      name,
      nationality
    });
  }
}

async function importCircuits() {
  for (let row of parse('circuits.csv')) {
    let [id, slug, name, location, country, lat, lon, altitude, url] = row;
    await db('circuits').insert({
      id: parseInt(id),
      name,
      location,
      country,
      coords: [lat, lon]
    });
  }
}

async function importStatusCodes() {
  for (let row of parse('status.csv')) {
    let [id, label] = row;
    await db('status_codes').insert({
      id: parseInt(id),
      label,
    });
  }
}

async function importRaces() {
  for (let row of parse('races.csv')) {
    let [id, year, round, circuit_id, name, date, time, url] = row;
    await db('races').insert({
      id: parseInt(id),
      circuit_id: parseInt(circuit_id),
      year: parseInt(year),
      round: parseInt(round),
      name,
      event_time: time ? `${date} ${time}` : date,
    });
  }
}

async function importRaceResults() {
  for (let row of parse('results.csv')) {
    let [id, race_id, driver_id, team_id, car_number, grid_position] = row;

    if (['F', 'W'].indexOf(row[7]) != -1) {
      // F: Failed to qualify for the race.
      // W: Withdrew from the race.
      continue;
    }

    try {
      await db('race_results').insert({
        id: parseInt(id),
        race_id: parseInt(race_id),
        driver_id: parseInt(driver_id),
        team_id: parseInt(team_id),
        status_id: parseInt(row[17]),
        car_number: parseInt(car_number),
        grid_position: parseInt(grid_position) || null,
        position: parseInt(row[8]) || null,
        points: parseFloat(row[9]) || null,
        laps: parseInt(row[10]) || null,
        duration: int2time(parseInt(row[12])) || null,
        finished: !Number.isNaN(parseInt(row[7])),
      });

      if (row[15]) {
        await db('fastest_laps').insert({
          id: parseInt(id),
          lap_number: parseInt(row[13]),
          lap_time: row[15],
          rank: parseInt(row[14]),
        });
      }
    } catch (error) {
      console.error('failed to insert race result', id, race_id, driver_id, team_id);
    }
  }
}

async function importQualiResults() {
  for (let row of parse('qualifying.csv')) {
    let [id, race_id, driver_id, team_id, car_number, position, q1, q2, q3] = row;

    // let segments = [q1, q2, q3].filter(time => !!time).map((time) => {
    //   let match = time.exec(/(\d+):(\d+)\.(\d+)/);
    //
    //   if (!match) {
    //     console.error(`Invalid quali time: ${time}`);
    //   }
    //   // Convert to milliseconds
    //   return (parseInt(match[1]) * 1000 * 60) + (parseInt(match[2]) * 1000) + parseInt(match[3]);
    // });

    let segments = [q1, q2, q3].filter(time => !!time).map(time => {
      return time.replace(/^(\d+):(\d+):(\d+)$/, '$1:$2.$3');
    });

    await db('quali_results').insert({
      id: parseInt(id),
      race_id: parseInt(race_id),
      driver_id: parseInt(driver_id),
      team_id: parseInt(team_id),
      position: parseInt(position),
      lap_time: segments.length ? segments[segments.length - 1] : null,
      segment_times: segments.length ? segments : null
    });
  }
}

async function importPitStops() {
  for (let row of parse('pit_stops.csv')) {
    let [race_id, driver_id, , lap, , duration] = row;

    if (duration && duration.indexOf(':') == -1) {
      duration = `00:${duration}`;
    }

    await db('pit_stops').insert({
      race_id: parseInt(race_id),
      driver_id: parseInt(driver_id),
      lap: parseInt(lap),
      duration
    });
  }
}

async function run_imports() {
  let imports = [
    // importDrivers,
    // importConstructors,
    // importCircuits,
    // importStatusCodes,
    // importRaces,
    // importRaceResults,
    importQualiResults,
    // importPitStops,
  ];

  const progress = [];

  for (let func of imports) {
    progress.push('.');
    console.log(progress.join(''));
    await func();
  }

  console.log('imports done');
}

run_imports();

// console.log(int2time(5332936));
