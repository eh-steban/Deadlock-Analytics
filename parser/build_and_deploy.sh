docker buildx build --platform linux/amd64,linux/arm64 --target production -t registry.hazerd.dev/deadlock-stats/parser:latest --push .
