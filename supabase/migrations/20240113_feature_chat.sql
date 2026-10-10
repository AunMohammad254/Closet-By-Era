-- Create Support Tickets Table
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  status text check (status in ('open', 'closed')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Support Messages Table
create table if not exists support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Ticket Policies
create policy "Users can view own tickets" on support_tickets for select
  using (auth.uid() = user_id);

create policy "Users can create own tickets" on support_tickets for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all tickets" on support_tickets for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update all tickets" on support_tickets for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Message Policies
create policy "Users can view messages for own tickets" on support_messages for select
  using (exists (select 1 from support_tickets where id = support_messages.ticket_id and user_id = auth.uid()));

create policy "Users can insert messages for own tickets" on support_messages for insert
  with check (exists (select 1 from support_tickets where id = ticket_id and user_id = auth.uid()));

create policy "Admins can view all messages" on support_messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert all messages" on support_messages for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
