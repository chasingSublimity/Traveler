CREATE TABLE trips (
    id serial PRIMARY KEY,
    origin text,
    destination text
);

CREATE TABLE memories (
    id serial PRIMARY KEY,
    trip_id int REFERENCES trips ON DELETE CASCADE,
    img_url text,
    location text,
    comments text
);