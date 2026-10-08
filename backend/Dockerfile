FROM golang:1.25.1-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o /out/rsident-api ./cmd/api

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/rsident-api /app/rsident-api

RUN mkdir -p \
    /app/uploads \
    /app/logs \
    /app/credentials

EXPOSE 8080

CMD ["/app/rsident-api"]