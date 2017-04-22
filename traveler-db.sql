CREATE TABLE trips (
  id serial PRIMARY KEY,
  origin text NOT NULL,
  destination text NOT NULL,
  begin_date timestamp NOT NULL,
  end_date timestamp NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE memories (
  id serial PRIMARY KEY,
  trip_id int REFERENCES trips ON DELETE CASCADE,
  img_url text,
  location text NOT NULL,
  date_created timestamp NOT NULL,
  comments text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);