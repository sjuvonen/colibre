# Colibre

Colibre is a small CMS based on Node.js and MongoDB. It isn't meant for anyone's production environment,
rather just to run the author's own website. But open sourcing code is always nice.

## Components
Main components used are as follows
- Node.js
- Express
- MongoDB
- Mongoose
- Passport
- Twig.js
- Bootstrap 4

###
Colibre is loosely based on Express.js, i.e. it uses Express as the engine but re-implements and
overrides some of the core components. 

## Requirements
The app is designed to be ran on latest components. Node.js (>= 5.0.0) must be executed with
the --harmony flag to enable some experimental ES6 features.

## Notes
Colibre modules' dependencies aren't tracked in any specific way as of now. Basically they are loaded
in the config.json.dist in the order which avoids dependency issues.
