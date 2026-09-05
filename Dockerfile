FROM node:22-alpine AS web
WORKDIR /build
ARG BUILD_SHA=dev
ENV VITE_BUILD_SHA=$BUILD_SHA
COPY package.json package-lock.json ./
RUN npm ci
COPY frontend ./frontend
RUN npm run build

FROM rust:1-bookworm AS server
WORKDIR /build
ARG BUILD_SHA=dev
ENV BUILD_SHA=$BUILD_SHA
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN groupadd --system app && useradd --system --gid app --home-dir /app app \
    && mkdir -p /app /data && chown -R app:app /app /data
WORKDIR /app
COPY --from=server /build/target/release/humane-practical-exams /usr/local/bin/humane-practical-exams
COPY --from=web /build/dist ./dist
VOLUME ["/data"]
EXPOSE 8080
USER app
CMD ["humane-practical-exams"]
