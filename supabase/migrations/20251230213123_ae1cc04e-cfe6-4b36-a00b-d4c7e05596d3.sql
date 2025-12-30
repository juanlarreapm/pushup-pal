-- Create pushup_logs table to store daily sets and reps
CREATE TABLE public.pushup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reps INTEGER NOT NULL CHECK (reps > 0),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by user and date
CREATE INDEX idx_pushup_logs_user_date ON public.pushup_logs (user_id, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE public.pushup_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pushup logs"
ON public.pushup_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pushup logs"
ON public.pushup_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pushup logs"
ON public.pushup_logs
FOR DELETE
USING (auth.uid() = user_id);