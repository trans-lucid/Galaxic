begin;
select plan(1);
select has_table('example_items');
select * from finish();
rollback;
