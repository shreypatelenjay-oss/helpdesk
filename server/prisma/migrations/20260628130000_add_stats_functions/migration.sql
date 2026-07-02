CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE (
  "totalTickets"     BIGINT,
  "openTickets"      BIGINT,
  "aiResolvedTickets" BIGINT,
  "aiResolvedPercent" INTEGER,
  "avgResolutionMs"  DOUBLE PRECISION
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('NEW', 'PROCESSING'))                  AS "totalTickets",
    COUNT(*) FILTER (WHERE status = 'OPEN')                                      AS "openTickets",
    COUNT(*) FILTER (WHERE "resolvedByAI" = TRUE)                                AS "aiResolvedTickets",
    CASE
      WHEN COUNT(*) FILTER (WHERE status NOT IN ('NEW', 'PROCESSING')) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE "resolvedByAI" = TRUE)::NUMERIC * 100 /
        COUNT(*) FILTER (WHERE status NOT IN ('NEW', 'PROCESSING'))
      )::INTEGER
    END                                                                          AS "aiResolvedPercent",
    AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) * 1000)
      FILTER (WHERE "resolvedAt" IS NOT NULL)                                    AS "avgResolutionMs"
  FROM "Ticket";
$$;

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
    GROUP BY 1
  ) t ON t.day = gs::DATE
  ORDER BY gs ASC;
$$;
