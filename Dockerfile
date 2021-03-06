ARG ARCH
FROM $ARCH

RUN apk add --update --no-cache openssh

ENV INSTALL_DIRECTORY=/opt/tor_install \
		APP_DIRECTORY=/opt/tor \
		WORKING_DIRECTORY=/var/tor

WORKDIR $INSTALL_DIRECTORY
ADD package*.json ./
RUN npm ci --only=production

WORKDIR $APP_DIRECTORY
RUN cp -a $INSTALL_DIRECTORY/node_modules $APP_DIRECTORY
ADD . $APP_DIRECTORY/

CMD ["node", "bin/tor", "missing"]
