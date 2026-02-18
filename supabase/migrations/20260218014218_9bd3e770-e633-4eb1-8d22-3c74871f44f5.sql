
-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow public read
CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Allow public insert
CREATE POLICY "Public insert uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Allow public update
CREATE POLICY "Public update uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');

-- Allow public delete
CREATE POLICY "Public delete uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');
