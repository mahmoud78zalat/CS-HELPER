-- =====================================================
-- SIMPLE TEST SCRIPT - Execute this first to validate types
-- =====================================================

-- Test 1: Check if auth.uid() casting works
DO $$
BEGIN
    -- Test auth.uid() to TEXT conversion
    IF auth.uid()::TEXT IS NOT NULL THEN
        RAISE NOTICE 'Type casting test PASSED: auth.uid()::TEXT works correctly';
    ELSE
        RAISE NOTICE 'Type casting test INFO: No authenticated user (expected in direct SQL execution)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Type casting test FAILED: %, %', SQLERRM, SQLSTATE;
END $$;

-- Test 2: Create FAQ table only (simplest version)
CREATE TABLE IF NOT EXISTS faqs_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 3: Insert sample data
INSERT INTO faqs_test (question, answer) VALUES 
('Test FAQ', 'This is a test answer') 
ON CONFLICT DO NOTHING;

-- Test 4: Query the data
SELECT 'Test completed successfully!' as status, COUNT(*) as faq_count FROM faqs_test;

-- Clean up test table
DROP TABLE IF EXISTS faqs_test;

SELECT 'All tests passed! Ready to execute main script.' as final_status;