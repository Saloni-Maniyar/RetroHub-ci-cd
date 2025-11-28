# ----------- Build Vite React App -----------
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./

RUN npm install

COPY . .
RUN npm run build


# ----------- Production Stage -----------
FROM nginx:alpine

# Copy custom routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
