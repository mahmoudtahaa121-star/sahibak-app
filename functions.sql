-- ============================================================
-- صاحبك (Sahibak) — Database Functions & Triggers
-- ============================================================
-- This file contains:
-- - All database functions
-- - All triggers
-- ============================================================

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at COLUMN
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE touch_updated_at();

DROP TRIGGER IF EXISTS trg_places_updated ON places;
CREATE TRIGGER trg_places_updated
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE PROCEDURE touch_updated_at();

DROP TRIGGER IF EXISTS trg_offers_updated ON offers;
CREATE TRIGGER trg_offers_updated
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE PROCEDURE touch_updated_at();

DROP TRIGGER IF EXISTS trg_edit_req_updated ON place_edit_requests;
CREATE TRIGGER trg_edit_req_updated
  BEFORE UPDATE ON place_edit_requests
  FOR EACH ROW
  EXECUTE PROCEDURE touch_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated ON reports;
CREATE TRIGGER trg_reports_updated
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE PROCEDURE touch_updated_at();

-- ============================================================
-- CATEGORY LIMIT CHECK
-- ============================================================
CREATE OR REPLACE FUNCTION check_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  cat_count INT;
  p_type TEXT;
  max_cats INT;
BEGIN
  SELECT place_type INTO p_type FROM places WHERE id = NEW.place_id;
  SELECT COUNT(*) INTO cat_count
    FROM place_categories WHERE place_id = NEW.place_id;
  
  max_cats := CASE p_type
    WHEN 'shop' THEN 1
    WHEN 'person' THEN 2
    ELSE 1
  END;
  
  IF cat_count >= max_cats THEN
    RAISE EXCEPTION 'تجاوزت الحد المسموح من الكاتيجوريز (%)', max_cats;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_category_limit ON place_categories;
CREATE TRIGGER trg_category_limit
  BEFORE INSERT ON place_categories
  FOR EACH ROW
  EXECUTE PROCEDURE check_category_limit();

-- ============================================================
-- PROVIDER LIMIT CHECK
-- ============================================================
CREATE OR REPLACE FUNCTION check_provider_limits()
RETURNS TRIGGER AS $$
DECLARE
  shop_count INT;
  person_count INT;
  max_shops INT;
  max_persons INT;
BEGIN
  SELECT COALESCE(value::INT, 3) INTO max_shops
    FROM app_config WHERE key = 'max_shop_per_provider';
  SELECT COALESCE(value::INT, 5) INTO max_persons
    FROM app_config WHERE key = 'max_person_per_provider';
  
  IF max_shops IS NULL THEN max_shops := 3; END IF;
  IF max_persons IS NULL THEN max_persons := 5; END IF;

  SELECT COUNT(*) INTO shop_count
    FROM places
    WHERE provider_id = NEW.provider_id
      AND place_type = 'shop' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO person_count
    FROM places
    WHERE provider_id = NEW.provider_id
      AND place_type = 'person' AND deleted_at IS NULL;

  IF NEW.place_type = 'shop' AND shop_count >= max_shops THEN
    RAISE EXCEPTION 'مسموح بـ % محل بس حالياً', max_shops;
  END IF;
  
  IF NEW.place_type = 'person' AND person_count >= max_persons THEN
    RAISE EXCEPTION 'مسموح بـ % profile شخصي بس', max_persons;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provider_limits ON places;
CREATE TRIGGER trg_provider_limits
  BEFORE INSERT ON places
  FOR EACH ROW
  EXECUTE PROCEDURE check_provider_limits();
