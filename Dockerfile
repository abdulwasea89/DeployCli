# Use a slim Node.js image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (using wildcards to ensure package.json AND package-lock.json are copied)
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Grant execute permissions to the bin file
RUN chmod +x ./bin/deploy.js

# Allow the application to use colors in the terminal
ENV TERM=xterm-256color

# The CLI is interactive, so we should run it directly
ENTRYPOINT ["node", "--import", "tsx", "src/source.tsx"]
