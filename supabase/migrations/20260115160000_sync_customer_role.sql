-- Function to sync role from public.customers to auth.users metadata
create or replace function public.sync_customer_role()
returns trigger as $$
begin
  -- Update the auth.users metadata with the new role
  update auth.users
  set raw_app_meta_data = 
    jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(new.role)
    )
  where id = new.auth_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the sync function on insert or update of role
drop trigger if exists on_customer_role_change on public.customers;
create trigger on_customer_role_change
  after insert or update of role on public.customers
  for each row
  execute procedure public.sync_customer_role();
