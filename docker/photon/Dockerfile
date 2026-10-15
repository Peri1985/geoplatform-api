FROM eclipse-temurin:21-jre

ARG PHOTON_VERSION=1.3.0

WORKDIR /photon
ADD https://github.com/komoot/photon/releases/download/${PHOTON_VERSION}/photon-${PHOTON_VERSION}.jar /photon/photon.jar
COPY entrypoint.sh /photon/entrypoint.sh
RUN chmod +x /photon/entrypoint.sh

EXPOSE 2322
ENTRYPOINT ["/photon/entrypoint.sh"]
