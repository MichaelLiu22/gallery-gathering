-- 确保 profiles 表有正确的主键约束
-- 如果 user_id 不是主键，我们需要添加唯一约束来支持 upsert 操作

-- 检查当前表结构并添加必要的约束
DO $$ 
BEGIN
  -- 如果 user_id 列没有唯一约束，则添加
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;