FROM node:22.12-bookworm-slim as builder

ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get update && \
        apt-get upgrade -y
RUN apt-get -y install g++ make python3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
        > /app/root.cert

COPY . .

RUN CYPRESS_INSTALL_BINARY=0 npm ci --no-audit && \
        npm run build && \
        export BUILD_NUMBER=${BUILD_NUMBER:-1_0_0} && \
        export GIT_REF=${GIT_REF:-dummy} && \
        npm run record-build-info

RUN npm prune --production

FROM node:22.12-bookworm-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

# Cache breaking
ENV BUILD_NUMBER ${BUILD_NUMBER:-1_0_0}

RUN apt-get update && \
        apt-get upgrade -y && \
        apt-get autoremove -y && \
        rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 --system appgroup && \
        adduser --uid 2000 --system appuser --gid 2000

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

# Create app directory
RUN mkdir /app && chown appuser:appgroup /app
USER 2000
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        /app/dist \
        /app/root.cert \
        /app/build-info.json \
        ./

COPY --from=builder --chown=appuser:appgroup \
        /app/assets ./assets

COPY --from=builder --chown=appuser:appgroup \
        /app/node_modules ./node_modules

COPY --from=builder --chown=appuser:appgroup \
        /app/server/views ./server/views

ENV PORT=3000

EXPOSE 3000
USER 2000

CMD [ "npm", "start" ]
