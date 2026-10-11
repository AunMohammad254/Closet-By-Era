-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own login history"
    ON login_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all login history"
    ON login_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.auth_id = auth.uid()
            AND customers.role = 'super_admin'
        )
    );

CREATE POLICY "Users can insert their own login history"
    ON login_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);
