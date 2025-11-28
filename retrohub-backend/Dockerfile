# ----------- Backend Stage -----------
FROM node:18

WORKDIR /app

# Copy only package files first (cache friendly)
COPY package*.json ./

# Install dependencies WITHOUT devDeps → smaller image
RUN npm install --omit=dev

# Copy remaining source code
COPY . .

# Expose backend port
EXPOSE 5001

CMD ["npm", "start"]
