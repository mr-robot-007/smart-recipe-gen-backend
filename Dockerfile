FROM node:20.9.0
 
WORKDIR /app
 
COPY package.json package.json
COPY package-lock.json package-lock.json
 
RUN npm install
 
COPY . .

EXPOSE 5000
 
CMD [ "node", "server.js" ]