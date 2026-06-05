# 🌡️ NVROX - Environmental X

**NVROX** is a real-time environmental monitoring system for temperature and humidity, designed for industrial use. It uses **ESP32** microcontrollers with sensors, communicates via **MQTT (EMQX broker)**, and features a powerful backend with **Node.js** and a modern frontend using **React (Vite + TypeScript)**.

> NVROX = **ENVIRonmental + X**  
> A smart, scalable monitoring solution for your factory floor.

---

## ⚙️ Prerequisites

- **Node.js (v18+)**
- **EMQX Broker (MQTT)**
- **Redis**
- **MariaDB** or **MySQL**

---

## 📦 Tech Stack

### 🔌 IoT & Communication

- **ESP32** microcontrollers
- **MQTT protocol** via **EMQX** broker

### 🛠️ Backend

- **Node.js** + **Express.js**
- **Knex.js** (SQL query builder)
- **MariaDB** (relational database)
- **Socket.IO** (WebSocket for real-time data)
- **Redis** (caching & fast data access)

### 💻 Frontend

- **React** (Vite + TypeScript)
- **TailwindCSS** + **ShadCN UI**
- **Socket.IO Client** for real-time updates

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nvrox.git
cd nvrox
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Edit the environment configuration file `.env` under the `backend/` path:

```env
# --- Server ---
PORT=3000                        # App/server port

# --- Database ---
DB_CLIENT=mysql2                 # DB driver: mysql2, pg, sqlite3, etc.
DB_HOST=localhost                # DB server address
DB_USER=yourusername             # DB username
DB_PASSWORD=yourpassword         # DB password
DB_NAME=nvrox_db                 # DB name
DB_PORT=3306                     # DB port (MySQL default: 3306)

# --- MQTT Broker ---
MQTT_BROKER=mqtt://localhost:1883  # Broker URL (e.g. EMQX, Mosquitto)
MQTT_TOPIC=nvrox/temp-hum          # Topic to publish/subscribe
MQTT_QOS=1                         # QoS level: 0, 1, or 2
```

---

### 4. Setup the Database

Run the following commands to apply migrations and seed initial data:

```bash
npx knex migrate:latest --knexfile ./database/knex-config.js
npx knex seed:run --knexfile ./database/knex-config.js
```

---

### 5. Run the Application

#### Start Backend

```bash
cd backend
npm run dev
```

#### Start Frontend

```bash
cd ../frontend
npm run dev
```

Open your browser and go to `http://localhost:5173` to access the monitoring dashboard.

---

## ✨ Features

- 📶 Real-time temperature & humidity monitoring
- 🔧 MQTT-based device communication (EMQX)
- 📊 Web-based dashboard with live updates
- 🧠 Configurable thresholds & alert logic
- 🗃️ Historical data storage (MariaDB)
- 🔌 Fast WebSocket communication with Socket.IO
- 📱 Ready for industrial & scalable deployment

---

## 🗂 Project Structure

```
nvrox/
├── backend/          # API, MQTT client, database handlers
│   ├── index.js
│   ├── routes/
│   ├── mqtt/
│   ├── database/
│   └── ...
├── frontend/         # Web UI (React + Vite)
│   ├── src/
│   ├── public/
│   └── ...
├── README.md
```

---

## 📷 Screenshots

> ASAP

---

## 📃 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and distribute as needed.

---

## 🤝 Contribution

Contributions are welcome!  
Feel free to open issues, fork the repo, and submit pull requests.

---

## 📬 Contact

For questions or support, please open an issue or contact [debugmeAI](https://github.com/debugmeAI)
