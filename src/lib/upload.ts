import { supabase, ENV_OK } from './supabaseClient';

export async function safeUpload(file: File): Promise<string> {
  if (!ENV_OK || !supabase) {
    throw new Error('Upload disabled: missing Supabase env.');
  }

  if (!file) {
    throw new Error('No file provided');
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `images/${Date.now()}.${ext}`;
  const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'photos';

  const res = await supabase.storage.from(bucket).upload(path, file, { 
    upsert: false,
    cacheControl: '3600'
  });

  if (!res) {
    throw new Error('Upload failed: empty response');
  }

  if (res.error) {
    throw res.error;
  }

  const uploaded = res.data;
  if (!uploaded?.path) {
    throw new Error('Upload success but no path');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(uploaded.path);
  return data?.publicUrl ?? uploaded.path;
}

export async function safeUploadMultiple(files: File[]): Promise<string[]> {
  if (!ENV_OK || !supabase) {
    throw new Error('Upload disabled: missing Supabase env.');
  }

  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  const uploadPromises = files.map(file => safeUpload(file));
  return Promise.all(uploadPromises);
}
