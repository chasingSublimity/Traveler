CREATE TABLE trips (
  id serial PRIMARY KEY,
  origin text NOT NULL,
  destination text NOT NULL,
  begin_date date NOT NULL,
  end_date date NOT NULL
);

CREATE TABLE memories (
  id serial PRIMARY KEY,
  trip_id int REFERENCES trips ON DELETE CASCADE,
  img_url text,
  location text NOT NULL,
  date_created date NOT NULL,
  comments text
);