# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

ENV VITE_API_BASE_URL=http://wms_backend:5000

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Production stage ----------
FROM nginx:alpine

# 🔴 REMOVE default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 🔴 COPY YOUR nginx.conf (THIS WAS MISSING)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 🔴 COPY BUILT FILES
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
