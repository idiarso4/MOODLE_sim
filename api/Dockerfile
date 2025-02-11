FROM node:14

# Add build dependencies
RUN apt-get update && apt-get install -y python3 make g++ gcc

WORKDIR /app

# Set npm configuration
RUN npm config set unsafe-perm true
RUN npm config set legacy-peer-deps true

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

# Start the application
CMD ["npm", "start"]
