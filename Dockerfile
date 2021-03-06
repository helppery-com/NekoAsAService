FROM node:latest

RUN apt update
RUN apt install curl -y
RUN curl -sSL https://get.docker.com/ | sh

COPY . /naas
WORKDIR /naas

RUN npm install

CMD ["node", "src/index.js"]