FROM node:18-alpine

WORKDIR /app

# Install required packages
COPY package.json .
RUN npm install

# Copy application files
COPY . .

# Set terminal environment
ENV TERM=xterm-256color
ENV FORCE_COLOR=3
ENV COLORTERM=truecolor

CMD ["node", "log_theater.js"]