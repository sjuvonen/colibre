CREATE TABLE circuits (
  id serial NOT NULL,
  slug varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  location varchar(255),
  country varchar(255),
  coords geography(POINT, 4326),
  url varchar(255) NOT NULL,

  PRIMARY KEY(id),
  UNIQUE(slug),
  UNIQUE(url)
);

CREATE TABLE teams (
  id serial NOT NULL,
  slug varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  nationality varchar(255),
  url varchar(255) NOT NULL,

  PRIMARY KEY(id),
  UNIQUE(slug)
);

CREATE TABLE drivers (
  id serial NOT NULL,
  slug varchar(255) NOT NULL,
  number int,
  code varchar(3),
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  birthday date,
  nationality varchar(255),
  url varchar(255) NOT NULL,

  PRIMARY KEY(id),
  UNIQUE(slug)
);

CREATE TABLE races (
  id serial NOT NULL,
  circuit_id int NOT NULL,
  year int NOT NULL,
  round int NOT NULL,
  name varchar(255) NOT NULL,
  event_time timestamp NOT NULL,
  url varchar(255),

  PRIMARY KEY(id),
  FOREIGN KEY(circuit_id) REFERENCES circuits(id)
);

CREATE TABLE statuses (
  id serial NOT NULL,
  label varchar(255) NOT NULL,

  PRIMARY KEY(id),
  UNIQUE(label)
);

CREATE TABLE team_results (
  id serial NOT NULL,
  race_id int NOT NULL,
  team_id int NOT NULL,
  points decimal NOT NULL DEFAULT 0,
  status varchar(255),

  PRIMARY KEY(id),
  FOREIGN KEY(race_id) REFERENCES races(id),
  FOREIGN KEY(team_id) REFERENCES teams(id),
  UNIQUE(race_id, team_id)
);

CREATE TABLE team_standings (
  id serial NOT NULL,
  team_id int NOT NULL,
  race_id int NOT NULL,
  points decimal NOT NULL DEFAULT 0,
  position int,
  position_label varchar(255),
  wins int NOT NULL DEFAULT 0,

  PRIMARY KEY(id),
  FOREIGN KEY(race_id) REFERENCES races(id),
  FOREIGN KEY(team_id) REFERENCES teams(id),
  UNIQUE(team_id, race_id)
);

CREATE TABLE driver_standings (
  id serial NOT NULL,
  driver_id int NOT NULL,
  race_id int NOT NULL,
  points decimal NOT NULL DEFAULT 0,
  position int,
  label varchar(255),
  wins int NOT NULL DEFAULT 0,

  PRIMARY KEY(id),
  FOREIGN KEY(driver_id) REFERENCES drivers(id),
  FOREIGN KEY(race_id) REFERENCES races(id),
  UNIQUE(driver_id, race_id)
);

CREATE TABLE lap_times (
  race_id int NOT NULL,
  driver_id int NOT NULL,
  lap int NOT NULL,
  position int,
  duration time,

  PRIMARY KEY(race_id, driver_id, lap),
  FOREIGN KEY(driver_id) REFERENCES drivers(id),
  FOREIGN KEY(race_id) REFERENCES races(id)
);

CREATE TABLE pit_stops (
  race_id int NOT NULL,
  driver_id int NOT NULL,
  lap int NOT NULL,
  duration time,

  PRIMARY KEY(race_id, driver_id, lap),
  FOREIGN KEY(driver_id) REFERENCES drivers(id),
  FOREIGN KEY(race_id) REFERENCES races(id)
);

CREATE TABLE qualifying_results (
  id serial NOT NULL,
  race_id int NOT NULL,
  driver_id int NOT NULL,
  team_id int NOT NULL,
  position int,
  q1 time,
  q2 time,
  q3 time,

  PRIMARY KEY (id),
  UNIQUE(race_id, driver_id),
  FOREIGN KEY (race_id) REFERENCES races(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE race_results (
  id serial NOT NULL,
  race_id int NOT NULL,
  driver_id int NOT NULL,
  team_id int NOT NULL,
  status_id int NOT NULL,
  position int NOT NULL,
  laps int,
  duration time,
  -- best_lap time,

  PRIMARY KEY(id),
  FOREIGN KEY(race_id) REFERENCES races(id),
  FOREIGN KEY(driver_id) REFERENCES drivers(id),
  FOREIGN KEY(team_id) REFERENCES teams(id),
  FOREIGN KEY(status_id) REFERENCES statuses(id),
  UNIQUE(race_id, driver_id)
);
