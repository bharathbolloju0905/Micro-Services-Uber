**Micro-Services-Uber**

**Overview**
- **Description:** A small microservices-based Uber-like system with 4 services: a Gateway, Users service, Captain service, and Ride service. Services communicate via RabbitMQ and use JWT cookies/headers for authentication.
- **Core features:**
  - **User auth:** register, login, logout, profile
  - **Captain auth + availability:** register, login, toggle availability, long-poll for new rides
  - **Ride lifecycle:** create ride (user), publish new-ride event, captain accepts ride and publishes ride-accepted event
  - **Gateway:** routes requests to the appropriate service (proxy)

**Services & Default Ports**
- **Gateway:** `http://localhost:3000` (proxy to other services)
- **Users:** proxied at `http://localhost:3000/users` (service typically runs on `3001`)
- **Captain:** proxied at `http://localhost:3000/captain` (service typically runs on `3002`)
- **Ride:** proxied at `http://localhost:3000/ride` (service typically runs on `3003`)

Note: The gateway proxies `/users` -> `http://localhost:3001`, `/captain` -> `http://localhost:3002`, `/ride` -> `http://localhost:3003`. The Gateway port is configured via `PORT` in its `.env`.

**Environment Variables (per service)**
- `PORT` - Port the service listens on (e.g., `3000`, `3001`, `3002`, `3003`).
- `MONGO_URI` - MongoDB connection string.
- `JWT_SECRET` - Secret used to sign JWT tokens.
- `RABBIT_URL` - RabbitMQ connection URL (e.g. `amqp://localhost` or cloud URL). If omitted, some services use a default placeholder and will fail to connect.

Example `.env` for each service (replace values):

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/users-db
JWT_SECRET=your_jwt_secret
RABBIT_URL=amqp://localhost
```

**Setup & Run (PowerShell)**
- From each service folder run:

```powershell
cd "Users"
npm install
node server.js
```
Repeat for `Captain`, `Ride`, and finally run the `GateWay Service` (or run Gateway first). The Gateway runs on `PORT` (commonly `3000`) and proxies to the other services.

**Authentication**
- On successful login/register, the service sets a `token` cookie and returns the JWT in the JSON response under the `token` field.
- Protected endpoints accept the token via cookie or the `Authorization: Bearer <token>` header.

**API Endpoints & Examples**

**Users service (proxied at `http://localhost:3000/users`)**
- POST `/users/register` — register a new user
  - Body (JSON): `{ "name": "Alice", "email": "alice@example.com", "password": "secret" }`
  - Example:

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret"}'
```

- POST `/users/login` — login
  - Body (JSON): `{ "email": "alice@example.com", "password": "secret" }`
  - Example:

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'
```

- GET `/users/logout` — clears cookie
  - Example:

```bash
curl http://localhost:3000/users/logout
```

- GET `/users/profile` — protected, returns current user (read from JWT)
  - Example (using Bearer token):

```bash
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer <TOKEN>"
```

- GET `/users/accepted-ride` — long-poll endpoint: waits (up to ~30s) for `ride-accepted` event
  - Example (will keep connection open waiting for a captain to accept the ride):

```bash
curl http://localhost:3000/users/accepted-ride -H "Authorization: Bearer <TOKEN>"
```

When a captain accepts a ride, the Ride service publishes to `ride-accepted` and pending user requests will receive the ride data.

**Captain service (proxied at `http://localhost:3000/captain`)**
- POST `/captain/register` — register a captain
  - Body: `{ "name":"Bob", "email":"bob@example.com", "password":"secret" }`

- POST `/captain/login` — login

- GET `/captain/logout` — logout

- GET `/captain/profile` — protected

- PATCH `/captain/toggle-availability` — toggle captain availability (protected)
  - Example:

```bash
curl -X PATCH http://localhost:3000/captain/toggle-availability \
  -H "Authorization: Bearer <TOKEN>"
```

- GET `/captain/new-ride` — long-poll endpoint: captain waits for new rides
  - Example:

```bash
curl http://localhost:3000/captain/new-ride -H "Authorization: Bearer <TOKEN>"
```

When a user creates a ride, the Ride service publishes to `new-ride`. All captains currently waiting on `/captain/new-ride` will receive the ride data.

**Ride service (proxied at `http://localhost:3000/ride`)**
- POST `/ride/create-ride` — create a new ride (protected as user)
  - Body: `{ "source": "A", "destination": "B" }`
  - Example:

```bash
curl -X POST http://localhost:3000/ride/create-ride \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"source":"Home","destination":"Airport"}'
```
  - Behavior: saves ride to DB and publishes the ride object to the `new-ride` RabbitMQ queue.

- PUT `/ride/acceptRide?rideId=<RIDE_ID>` — captain accepts a ride (protected as captain)
  - Example:

```bash
curl -X PUT "http://localhost:3000/ride/acceptRide?rideId=<RIDE_ID>" \
  -H "Authorization: Bearer <CAPTAIN_TOKEN>"
```
  - Behavior: marks the ride as `accepted`, sets `captain`, saves, and publishes to `ride-accepted` queue. All pending user `accepted-ride` long-poll requests receive the ride data.

**RabbitMQ Queues**
- `new-ride` — messages are published by Ride service on ride creation; Captain service subscribes to notify waiting captains.
- `ride-accepted` — messages are published by Ride service when a captain accepts a ride; Users service subscribes to notify waiting users.

**Data models (high level)**
- User & Captain stores basic fields: `name`, `email`, `password` (hashed), plus `isAvailable` for captain.
- Ride stores: `user`, `source`, `destination`, `status` (e.g., `created`, `accepted`), and `captain` when accepted.

**Example Flow (end-to-end)**
1. Start RabbitMQ and MongoDB.
2. Run Users, Captain, and Ride services and the Gateway.
3. User registers and logs in -> receive token.
4. Captain logs in and hits `/captain/new-ride` to wait for rides.
5. User calls `/ride/create-ride` (with user token) -> Ride service saves ride and publishes to `new-ride`.
6. Captain's `/captain/new-ride` receives ride information. Captain calls `/ride/acceptRide?rideId=<ID>` with captain token.
7. Ride service sets ride as accepted and publishes to `ride-accepted`.
8. User(s) waiting on `/users/accepted-ride` receive ride acceptance details.

**Troubleshooting & Notes**
- Ensure `RABBIT_URL` points to a reachable RabbitMQ instance.
- Ensure the Gateway proxies point to the correct service ports.
- The services rely on cookie or Bearer header for the JWT token — be consistent when testing with `curl` or Postman.
- Long-poll endpoints use a 30s timeout and will return a `204` if no event occurs in that time.

**Next steps**
- Add `npm start` scripts to each `package.json` for easier startup.
- Add Docker compose to run MongoDB and RabbitMQ and start services in containers.

--
Generated README describing endpoints and examples. Update or tell me if you want Docker compose, more detailed API schemas, or automated start scripts added.
