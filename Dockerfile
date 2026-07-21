FROM node:18

# Establecemos la carpeta de trabajo
WORKDIR /app

# Copiamos TODOS los archivos de un golpe para que no diga que no existen
COPY . .

# Instalamos dependencias del frontend y lo construimos
# Usamos la ruta completa para no fallar
RUN npm install --prefix client
RUN npm run build --prefix client

# Instalamos dependencias del backend
RUN npm install --prefix server

# Exponemos el puerto
EXPOSE 3000

# Arrancamos el servidor
CMD ["node", "server/index.js"]