CREATE TABLE demo_teams (
  id serial NOT NULL,
  name varchar(60) NOT NULL,
  color varchar(20) NOT NULL,
  created timestamptz NOT NULL DEFAULT NOW(),

  PRIMARY KEY(id),
  UNIQUE(name),
  UNIQUE(color)
);

CREATE TABLE demo_players (
  id serial NOT NULL,
  team_id int NOT NULL,
  name varchar(100) NOT NULL,
  points int NOT NULL DEFAULT 0,
  created timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY(id),
  UNIQUE(name),
  FOREIGN KEY (team_id) REFERENCES demo_teams(id)
);




INSERT INTO demo_teams (name, color) VALUES
  ('Brazil', 'green'),
  ('Germany', 'black'),
  ('Spain', 'yellow'),
  ('Russian', 'red')
;

INSERT INTO demo_players (name, team_id) VALUES
  ('Neymar', 1),
  ('Ronaldinho', 1),
  ('Pretzel', 2),
  ('Tortilla', 3),
  ('Matryoshka', 4),
  ('Kalinka', 4)
;
