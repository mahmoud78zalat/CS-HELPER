-- Personal Notes Table for Supabase
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON personal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_created_at ON personal_notes(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own notes
CREATE POLICY "Users can manage their own notes" ON personal_notes
    FOR ALL USING (auth.uid()::text = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_notes_updated_at 
    BEFORE UPDATE ON personal_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();