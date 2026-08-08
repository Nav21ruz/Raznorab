-- ============================================================
-- Пробел в бане: у orders/labor_tasks/order_swipes/labor_responses/messages
-- уже была проверка "не забанен ли автор" (см. moderation_schema.sql), а у
-- builder_profiles — нет. Из-за этого забаненный строитель мог продолжать
-- редактировать своё публичное портфолио/анкету. Приводим к тому же правилу.
-- ============================================================

alter policy "builder manages own profile" on builder_profiles with check (
  auth.uid() = id and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "builder updates own profile" on builder_profiles with check (
  auth.uid() = id and not exists (select 1 from banned_users where profile_id = auth.uid())
);
