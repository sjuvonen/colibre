//
// const { EntityBase, EntityManager, EntityTypeManager } = require('./lib/entity-manager');
//
// class Team extends EntityBase {
//   static get schema() {
//     return {
//       id: 'team',
//       table: 'demo_teams',
//       fields: [
//         {
//           name: 'name',
//           type: String,
//           length: 100,
//         },
//         {
//           name: 'color',
//           type: String,
//         },
//         {
//           name: 'players',
//           type: [Player],
//           computed: true,
//         }
//       ]
//     }
//   }
// }
//
// class Player extends EntityBase {
//   static get schema() {
//     return {
//       id: 'player',
//       table: 'demo_players',
//       fields: [
//         {
//           name: 'name',
//           type: String,
//           length: 100,
//         },
//         {
//           name: 'points',
//           type: Number,
//         },
//         {
//           name: 'team',
//           column: 'team_id',
//           type: Team,
//         }
//       ]
//     };
//   }
// }
//
// const massive = require('massive');
// const loader_options = { allowedSchemas: ['public'], poolSize: 1 };
// const driver_options = { pgNative: false };
//
// massive({ database: 'colibre' }, loader_options, driver_options).then((db) => {
//   const em = new EntityManager(db);
//
//   em.addEntityType(Team);
//   em.addEntityType(Player);
//
//   let query = {color: 'green'};
//   em.storage('team').find(query).then((team) => {
//     console.log('FOUND', team);
//   });
//
//   // let foo = new Player;
//   // foo.name = 'Foo Bar';
//   // foo.points = 100;
// });



async function test() {
  let foo = Promise.resolve('ok');

  let result = await foo;
  let another = await foo;

  console.log(result, another);
}


test();
