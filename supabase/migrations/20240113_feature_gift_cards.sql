-- Create Gift Cards table
create table if not exists gift_cards (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  balance numeric not null default 0,
  initial_value numeric not null,
  is_active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Usage tracking table
create table if not exists gift_card_usage (
  id uuid default gen_random_uuid() primary key,
  gift_card_id uuid references gift_cards(id) not null,
  order_id uuid references orders(id) not null,
  amount_used numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table gift_cards enable row level security;
alter table gift_card_usage enable row level security;

-- Admins can do everything
create policy "Admins can manage gift cards" on gift_cards
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can view usage" on gift_card_usage
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Users can read gift cards (strictly for validation, might restrict to exact match only if possible via function, but SELECT is okay for now if we don't expose list)
-- Actually, strict RLS: User can viewing ONLY if they know the code? No, simple SELECT is risky if they can list all.
-- Better: No public SELECT on gift_cards. Use a SECURITY DEFINER function to validate.
-- BUT for simplicity in immediate implementation, let's allow "Admins only" for SELECT, and use a Postgres Function for validation that bypasses RLS safely.

-- Let's create the validation function now to avoid RLS issues for users
create or replace function validate_gift_card(code_input text)
returns json
language plpgsql
security definer
as $$
declare
  card_record record;
begin
  select * into card_record from gift_cards where code = code_input;
  
  if not found then
    return json_build_object('valid', false, 'message', 'Invalid code');
  end if;

  if not card_record.is_active then
    return json_build_object('valid', false, 'message', 'Card is inactive');
  end if;

  if card_record.expires_at is not null and card_record.expires_at < now() then
    return json_build_object('valid', false, 'message', 'Card has expired');
  end if;

  if card_record.balance <= 0 then
    return json_build_object('valid', false, 'message', 'Card has no balance');
  end if;

  return json_build_object(
    'valid', true,
    'id', card_record.id,
    'code', card_record.code,
    'balance', card_record.balance,
    'initial_value', card_record.initial_value
  );
end;
$$;
