# Use Node.js 20
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
