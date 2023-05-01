FROM node:19.4.0
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript@4.7.4
RUN npm install -g pm2@5.2.2
RUN npx prisma generate
RUN npm run prestart
CMD [ "npm", "start" ]