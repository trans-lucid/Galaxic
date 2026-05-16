insert into example_items (name)
values ('example'), ('galaxic')
on conflict do nothing;
