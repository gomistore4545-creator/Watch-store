/*
# Create product-images storage bucket

1. Storage
- Create a PUBLIC bucket named `product-images` for storing product
  photos uploaded from the admin panel.
- Public bucket so storefront <img> tags can load the URLs directly.

2. Security (storage policies)
- Allow anon + authenticated to READ (SELECT) objects — the storefront
  runs on the anon key and must be able to load product images.
- Allow anon + authenticated to INSERT (upload) objects — the admin
  panel runs on the anon key and must be able to upload product photos.
- Allow anon + authenticated to UPDATE + DELETE objects so the admin
  can replace or remove images.

3. Notes
- This is a single-tenant app with no sign-in, so policies are intentionally
  open to the anon role.
- Bucket is created idempotently with IF NOT EXISTS.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_product_images" ON storage.objects;
CREATE POLICY "anon_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_insert_product_images" ON storage.objects;
CREATE POLICY "anon_insert_product_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_update_product_images" ON storage.objects;
CREATE POLICY "anon_update_product_images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_delete_product_images" ON storage.objects;
CREATE POLICY "anon_delete_product_images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');
