const fs = require('fs');
const parse_inner = require('csv-parse/lib/sync');
const massive = require('massive');

const dirname = __dirname + '/../../f1db.files';

function parse(file) {
  let data = fs.readFileSync(`${dirname}/${file}`);
  let parsed = parse_inner(data, {
    cast: (value, context) => {
      return value == '\\N' ? null : value;
    }
  });
  return parsed;
}

massive({ database: 'f1db' }).then(async (db) => {
  // for (let row of parse('constructors.csv')) {
  //   let [id, slug, name, nationality, url] = row;
  //
  //   try {
  //     await db.teams.insert({
  //       id: parseInt(id),
  //       slug,
  //       name,
  //       nationality,
  //       url
  //     });
  //   } catch (e) {
  //     // pass
  //   }
  // }
  //
  // for (let row of parse('driver.csv')) {
  //   let [id, slug, number, code, first_name, last_name, birthday, nationality, url] = row;
  //   try {
  //     await db.drivers.insert({
  //       id: parseInt(id),
  //       slug,
  //       number,
  //       code,
  //       first_name,
  //       last_name,
  //       birthday,
  //       nationality,
  //       url
  //     });
  //   } catch (e) {
  //     // pass
  //   }
  // }
  //
  // for (let row of parse('circuits.csv')) {
  //   let [id, slug, name, location, country, lat, lon, altitude, url] = row;
  //
  //   try {
  //     await db.circuits.insert({
  //       id: parseInt(id),
  //       slug,
  //       name,
  //       location,
  //       country,
  //       url,
  //     });
  //   } catch (e) {
  //     // pass
  //   }
  // }
  //
  // for (let row of parse('status.csv')) {
  //   let [id, label] = row;
  //
  //   try {
  //     await db.statuses.insert({
  //       id: parseInt(id),
  //       label,
  //     });
  //   } catch (e) {
  //     // pass
  //   }
  // }
  //
  // for (let row of parse('races.csv')) {
  //   let [id, year, round, circuit_id, name, date, time, url] = row;
  //
  //   try {
  //     await db.races.insert({
  //       id: parseInt(id),
  //       circuit_id: parseInt(circuit_id),
  //       year: parseInt(year),
  //       round: parseInt(round),
  //       event_time: time ? `${date} ${time}` : date,
  //       name,
  //       url,
  //     });
  //   } catch (e) {
  //     // pass
  //     // console.error(e);
  //   }
  // }
  //
  // for (let row of parse('results.csv')) {
  //   let [id, race_id, driver_id, team_id] = row;
  //
  //   try {
  //     await db.race_results.insert({
  //       id: parseInt(id),
  //       race_id: parseInt(race_id),
  //       driver_id: parseInt(driver_id),
  //       team_id: parseInt(team_id),
  //       status_id: parseInt(row[17]),
  //       position: parseInt(row[8]) || null,
  //       laps: parseInt(row[10]) || null,
  //       // duration: parseInt(row[12]) || null,
  //     });
  //   } catch (e) {
  //     // pass
  //     // console.error(e);
  //   }
  // }
  //
  // for (let row of parse('qualifying.csv')) {
  //   let [id, race_id, driver_id, team_id, car_number, position, q1, q2, q3] = row;
  //
  //   if (q1 && q1.match(/\d+:\d+:\d+/)) {
  //     q1 = q1.replace(/(\d+):(\d+):(\d+)/, '$1:$2.$3');
  //   }
  //
  //   if (q2 && q2.match(/\d+:\d+:\d+/)) {
  //     q2 = q2.replace(/(\d+):(\d+):(\d+)/, '$1:$2.$3');
  //   }
  //
  //   if (q3 && q3.match(/\d+:\d+:\d+/)) {
  //     q3 = q3.replace(/(\d+):(\d+):(\d+)/, '$1:$2.$3');
  //   }
  //
  //   try {
  //     await db.qualifying_results.insert({
  //       id: parseInt(id),
  //       race_id: parseInt(race_id),
  //       driver_id: parseInt(driver_id),
  //       team_id: parseInt(team_id),
  //       position: parseInt(position),
  //       q1: q1 || null,
  //       q2: q2 || null,
  //       q3: q3 || null,
  //     });
  //   } catch (e) {
  //     // pass
  //     console.error(e);
  //   }
  // }
// 
  // for (let row of parse('pit_stops.csv')) {
  //   let [race_id, driver_id, , lap, , duration] = row;
  //
  //   if (duration && duration.indexOf(':') == -1) {
  //     duration = `00:${duration}`;
  //   }
  //
  //   try {
  //     await db.pit_stops.insert({
  //       race_id: parseInt(race_id),
  //       driver_id: parseInt(driver_id),
  //       lap: parseInt(lap),
  //       duration
  //     });
  //   } catch (e) {
  //     // pass
  //     console.error(e);
  //   }
  // }
});
