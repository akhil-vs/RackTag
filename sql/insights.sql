-- Phase 1 demand validation queries for usage_events + pilot_leads

-- Labels generated per day (last 30 days)
SELECT
  DATE(created_at) AS day,
  COUNT(*) FILTER (WHERE event_type IN ('download_png', 'add_to_sheet', 'print_sheet')) AS labels,
  COUNT(DISTINCT session_id) AS sessions
FROM usage_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Scan vs manual signal
SELECT
  COUNT(*) FILTER (WHERE event_type IN ('scan_barcode', 'scan_text')) AS scans,
  COUNT(*) FILTER (WHERE event_type = 'tab_change' AND tab = 'scan') AS scan_tab_visits,
  COUNT(*) FILTER (WHERE event_type IN ('download_png', 'add_to_sheet', 'print_sheet') AND tab <> 'scan') AS manual_labels
FROM usage_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Pilot interview pipeline
SELECT company_name, status, willingness_to_pay, estimated_budget, interview_date
FROM pilot_leads
ORDER BY created_at DESC;

-- Exit criteria helper: leads willing to pay for pilot
SELECT COUNT(*) AS pilot_ready_leads
FROM pilot_leads
WHERE willingness_to_pay IN ('yes', 'maybe')
  AND status IN ('interviewed', 'pilot');
