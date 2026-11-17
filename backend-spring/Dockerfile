FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN sed -i 's/\r$//' mvnw \
    && chmod +x mvnw

COPY src/ src/

RUN ./mvnw --batch-mode --no-transfer-progress \
    -Dmaven.test.skip=true clean package

FROM eclipse-temurin:17-jre

WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app app

COPY --from=build --chown=app:app \
    /app/target/demo-api-0.0.1-SNAPSHOT.jar /app/app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
