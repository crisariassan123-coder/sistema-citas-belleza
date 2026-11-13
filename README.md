# Sistema de citas · Salón de belleza

Sistema web para que las clientas de un salón de belleza agenden citas en línea según la disponibilidad real de la dueña, quien administra su agenda, servicios, horario, días inhábiles y vacaciones desde un panel privado.

**Stack:** Java 25 · Spring Boot 4 · Spring Security · Spring Data JPA · Thymeleaf · Bootstrap 5 · PostgreSQL 17 · Flyway · Docker

## Documentación

- [Requisitos e historias de usuario](docs/requisitos.md)
- [Modelo de datos y diagrama entidad-relación](docs/diagrama-er.md)
- [Diseño en Figma y prototipo navegable](docs/diseno/README.md)

## Cómo ejecutarlo en local

**Requisitos:** Java 25 y Docker Desktop.

1. Copiar las variables de entorno y definir una contraseña:
   ```bash
   cp .env.example .env
   ```
2. Levantar la base de datos:
   ```bash
   docker compose up -d
   ```
3. Arrancar la aplicación (Flyway crea las tablas automáticamente):
   ```bash
   ./mvnw spring-boot:run        # Linux / macOS / Git Bash
   mvnw.cmd spring-boot:run      # Windows (cmd)
   ```
4. Abrir http://localhost:8080

## Metodología

Desarrollo individual con **Scrumban**: sprints semanales, tablero en GitHub Projects, una rama `feature/*` por issue, Pull Requests hacia `develop` y Conventional Commits.
