FROM node:12.18.1

WORKDIR /app

COPY package.json /app
RUN npm install

ADD . /app

CMD ["npm", "start"]
