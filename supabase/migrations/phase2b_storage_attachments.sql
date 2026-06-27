-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — Storage: bucket "attachments" para guías UGC
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Crea el bucket que usa uploadAttachment() para PDFs, PPT/PPTX y audio-guías,
-- con políticas que permiten:
--   • Subir solo a TU propia carpeta  (ugc/<tu_user_id>/...)
--   • Lectura pública (el contenido premium se protege a nivel de app/paywall)
--
-- Idempotente: seguro de re-correr.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Crear el bucket público "attachments" (50 MB por archivo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  true,
  52428800,  -- 50 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'
  ]
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Políticas RLS sobre storage.objects para este bucket
drop policy if exists "attachments: public read"        on storage.objects;
drop policy if exists "attachments: owner upload"        on storage.objects;
drop policy if exists "attachments: owner update"        on storage.objects;
drop policy if exists "attachments: owner delete"        on storage.objects;

-- Lectura pública del bucket (el paywall vive en la app)
create policy "attachments: public read"
  on storage.objects for select
  using ( bucket_id = 'attachments' );

-- Subir solo a la propia carpeta: ugc/<auth.uid()>/...
create policy "attachments: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = 'ugc'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Actualizar solo los propios archivos
create policy "attachments: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Eliminar solo los propios archivos
create policy "attachments: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
