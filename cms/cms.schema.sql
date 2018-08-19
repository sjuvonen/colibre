
CREATE TYPE user_status AS ENUM ('not_verified', 'active', 'revoked');

CREATE TABLE users (
  id serial NOT NULL,
  created timestamptz NOT NULL DEFAULT NOW(),
  status user_status NOT NULL DEFAULT 'not_verified',
  username varchar(100) NOT NULL,
  password varchar(60),
  email varchar(255) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE(username),
  UNIQUE(email)
);

CREATE TABLE content (
  id serial NOT NULL,
  created timestamptz NOT NULL DEFAULT NOW(),
  owner_id int NOT NULL,
  title varchar(120) NOT NULL,

  PRIMARY KEY (id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
