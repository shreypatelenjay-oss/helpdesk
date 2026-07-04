CREATE OR REPLACE FUNCTION get_tickets_per_day()
RETURNS TABLE (date TEXT, count BIGINT) LANGUAGE sql STABLE AS $$
  SELECT
    TO_CHAR(gs::DATE, 'YYYY-MM-DD') AS date,
    COALESCE(t.cnt, 0)              AS count
  FROM generate_series(
    (NOW() AT TIME ZONE 'UTC')::DATE - INTERVAL '29 days',
    (NOW() AT TIME ZONE 'UTC')::DATE,
    INTERVAL '1 day'
  ) AS gs
  LEFT JOIN (
    SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')::DATE AS day, COUNT(*) AS cnt
    FROM "Ticket"
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      AND status NOT IN ('NEW', 'PROCESSING')
    GROUP BY 1
  ) t ON t.day = gs::DATE
  ORDER BY gs ASC;
$$;
