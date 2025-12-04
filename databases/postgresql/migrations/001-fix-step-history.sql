-- Fix step_history.step_id column type to support string IDs

BEGIN;

-- Alter step_id column from integer to varchar
ALTER TABLE execution_repository.step_history 
ALTER COLUMN step_id TYPE VARCHAR(100);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_step_history_step_id 
ON execution_repository.step_history(step_id);

COMMIT;
