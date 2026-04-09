FROM openjdk:17-alpine

WORKDIR /app

# Install basic tools if needed
RUN apk add --no-cache bash

# Copy the run script
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Default command
ENTRYPOINT ["/app/run.sh"]
