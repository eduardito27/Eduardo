# 1. Construir el Frontend (React)
FROM node:18 AS build-client
WORKDIR /app/client
# Copiamos los archivos de configuración desde la raíz/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Configurar el Servidor (Node.js)
FROM node:18
WORKDIR /app
# Copiamos archivos del servidor
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/

# 3. Copiar el frontend construido al servidor
# Nota: Verifica si tu React genera la carpeta 'build' o 'dist'
COPY --from=build-client /app/client/build ./server/public

EXPOSE 3000
# Comando para arrancar
CMD ["node", "server/index.js"]