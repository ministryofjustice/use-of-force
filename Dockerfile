FROM node:10-buster-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"
ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y make python curl wget && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install AWS RDS Root cert
RUN mkdir /home/appuser/.postgresql \
  && curl https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem \
    > /app/root.cert        

COPY --chown=appuser:appgroup . .

ENV BUILD_NUMBER ${BUILD_NUMBER:-1_0_0}
ENV GIT_REF ${GIT_REF:-dummy}

RUN npm ci && \
    npm run build && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

EXPOSE 3000
ENV NODE_ENV='production'
USER 2000

CMD [ "npm", "start" ]
