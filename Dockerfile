FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS build
COPY . .
RUN bun install --frozen-lockfile
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/core ./core
COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist

WORKDIR /app/server
EXPOSE 8000
CMD ["bun", "run", "start"]
