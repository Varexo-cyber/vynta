UPDATE admin_audit_log
SET metadata = jsonb_build_object('source', 'bootstrap')
WHERE action = 'owner_bootstrapped';
