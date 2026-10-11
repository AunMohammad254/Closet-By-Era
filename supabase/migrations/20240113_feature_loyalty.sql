-- Add loyalty_points to profiles
alter table profiles 
add column if not exists loyalty_points integer default 0;

-- Create Loyalty History Table
create table if not exists loyalty_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  points integer not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table loyalty_history enable row level security;

create policy "Users can view own history" on loyalty_history for select
  using (auth.uid() = user_id);

create policy "Admins can view all history" on loyalty_history for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
