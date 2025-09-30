CREATE TRIGGER checklist_item_state_set_updated_at
AFTER UPDATE ON checklist_item_state
FOR EACH ROW
BEGIN
  UPDATE checklist_item_state SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;