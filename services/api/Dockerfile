FROM golang:1.25.10-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/clinicpulse-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/clinicpulse-migrate ./cmd/migrate

FROM alpine:3.22

RUN addgroup -S clinicpulse && adduser -S -G clinicpulse clinicpulse
WORKDIR /app

COPY --from=build /out/clinicpulse-api /app/clinicpulse-api
COPY --from=build /out/clinicpulse-migrate /app/clinicpulse-migrate
COPY migrations /app/migrations

ENV CLINICPULSE_MIGRATIONS_DIR=/app/migrations
EXPOSE 8080

USER clinicpulse
CMD ["/app/clinicpulse-api"]
