-- Create a storage bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Set up security policies for the 'products' bucket
-- Allow public read access to everyone
create policy "Give public access to product images"
on storage.objects for select
using ( bucket_id = 'products' );

-- Allow authenticated users (admin) to upload/update/delete
-- Since we are using Supabase Auth for admin, we check for auth.role() = 'authenticated'
-- Or simpler: allow anyone to upload for now if auth isn't fully set up, but let's try authenticated.
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'products' );

create policy "Allow authenticated updates"
on storage.objects for update
to authenticated
using ( bucket_id = 'products' );

create policy "Allow authenticated deletions"
on storage.objects for delete
to authenticated
using ( bucket_id = 'products' );
