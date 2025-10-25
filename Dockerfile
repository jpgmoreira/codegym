FROM node:22-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 make g++ git \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["npm", "run"]
