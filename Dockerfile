FROM node:latest

RUN apt-get update
RUN apt-get install -y build-essential libxi-dev libglu1-mesa-dev libglew-dev xvfb mesa-utils libgl1-mesa-dri libglapi-mesa libosmesa6

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --production

EXPOSE 3000

COPY entrypoint.sh ./

ENTRYPOINT ["./entrypoint.sh"]
