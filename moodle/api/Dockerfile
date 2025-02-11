FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy rest of the application
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
