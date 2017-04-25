CREATE TABLE trips (
  id serial PRIMARY KEY,
  origin text NOT NULL,
  destination text NOT NULL,
  begin_date date NOT NULL,
  end_date date NOT NULL,
  user_id int REFERENCES users ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE memories (
  id serial PRIMARY KEY,
  trip_id int REFERENCES trips ON DELETE CASCADE,
  img_url text,
  location text NOT NULL,
  date_created date NOT NULL,
  comments text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);