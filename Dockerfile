# Etapa 1: Construcción de la aplicación
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci # 'npm ci' es generalmente preferido para builds CI/CD
COPY . .
RUN npm run build

# Etapa 2: Servir la aplicación
FROM node:20-alpine
WORKDIR /app
# Instalar 'serve' globalmente
RUN npm install -g serve
# Copiar solo los artefactos de construcción (la carpeta dist) de la etapa anterior
COPY --from=builder /app/dist ./dist

EXPOSE 5173
# El CMD para servir la carpeta 'dist'
CMD ["serve", "-s", "dist", "-l", "5173"]
