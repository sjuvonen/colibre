const sql = require('./index');
const { Pool } = require('pg');

let pool = new Pool({ database: 'colibre' });

 pool.connect().then(async (db) => {
  let select1 = sql.select('player_data')
    .from('demo_players p', 'id', 'name', 'points', 'team_id')
    .from('demo_teams t', 'color')
    .join('demo_teams t', 'p.team_id = t.id')
    .where('t.color', ['red', 'green'])
    .orWhere('p.points', 5, '>');


  console.log(select1.sql, select1.params);

  let result = await db.query(select1.sql, select1.params);
  console.log('ROWS', result.rows);
  //

  let insert = sql.insert('new_player')
    .into('demo_players')
    .set('name', 'NEW PLAYER X')
    .set('points', 63)
    .set('team_id', 1);

  let insert2 = sql.insert('new_team')
    .into('demo_teams')
    .set('name', 'Brown Bears')
    .set('color', 'brown');

  console.log(insert.sql, insert.params);

  await db.query(insert.sql, insert.params);
  await db.query(insert2.sql, insert2.params);


  let update1 = sql.update('cache_id')
    .table('demo_teams')
    .set('name', 'The Green Team')
    .where('id', 2);

  await db.query(update1.sql, update1.params);

  console.log(update1.sql, update1.params);
}).catch((error) => {
  console.error(error.stack);
});
