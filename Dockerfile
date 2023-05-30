FROM ubuntu:focal

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=5100

RUN apt -y update && apt -y upgrade && apt -y install curl && \
    apt -y install build-essential make git && \
    # download and install latest node
    curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
    apt install -y nodejs && \
    # install imagemagick
    # apt install -y imagemagick && \
    git clone https://github.com/ImageMagick/ImageMagick.git && cd ImageMagick && ./configure && \
    make && make install && \
    ldconfig /usr/local/lib && rm -rf ImageMagick && \
    # create node user
    useradd -ms /bin/bash node

USER node
WORKDIR /im/app
RUN mkdir -p /im/app/public
COPY package*.json ./
COPY --chown=node:node . .
VOLUME [ "/im/app/public" ]
RUN npm ci --omit=dev
EXPOSE $PORT
ENTRYPOINT [ "npm", "run", "start"]