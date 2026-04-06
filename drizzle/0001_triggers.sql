-- Function untuk auto update updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

-- Trigger encounters
CREATE TRIGGER trg_encounters_updated_at
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION fn_sync_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'BOOKED') THEN
    UPDATE appointment_slots
    SET
      booked_count = booked_count + 1,
      is_available = (booked_count + 1 < max_capacity)
    WHERE id = NEW.appointment_slot_id;

  ELSIF (TG_OP = 'UPDATE'
    AND OLD.status NOT IN ('CANCELLED')
    AND NEW.status = 'CANCELLED') THEN

    UPDATE appointment_slots
    SET
      booked_count = GREATEST(booked_count - 1, 0),
      is_available = TRUE
    WHERE id = NEW.appointment_slot_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_slot
AFTER INSERT OR UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION fn_sync_slot_availability();