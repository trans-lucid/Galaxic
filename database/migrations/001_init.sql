create table if not exists example_items (
  id serial primary key,
  name text not null,
  created_at timestamptz not null default now()
);
