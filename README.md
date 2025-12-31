# 🚀 Offer Bridge – Smart Discount & Escrow Platform

Offer Bridge is a **full-stack MERN platform** that securely connects **users who don’t have credit cards** with **credit card holders**, enabling them to access card-based discounts through an **admin-controlled escrow system**.

🔗 **Live Demo:** https://offer-bridge.onrender.com  
📦 **GitHub Repository:** https://github.com/AmitKK10/Offer-Bridge  

---

## 📌 Problem Statement

Many people miss out on online discounts because they **do not own credit cards**, while many credit card holders **do not fully utilize their card benefits**.

There is no trusted platform that safely connects these two groups while preventing fraud, payment disputes, and misuse.

---

## 💡 Solution Overview

Offer Bridge solves this problem by introducing a **secure, escrow-based system** where:

- Merchants request purchases without owning a credit card  
- Customers place orders using their credit cards and earn commission  
- Admin verifies every step and controls payment release  

Funds are **locked in escrow** and released **only after successful delivery confirmation**.

---

## 👥 User Roles

### 🧑‍💼 Merchant
- Creates deal requests
- Pays advance only after admin approval
- Tracks order status and delivery OTP
- Receives settlement after deal completion

### 🧑‍💻 Customer
- Views approved & funded deals
- Accepts a deal (time-bound lock)
- Places order using credit card
- Submits order proof and delivery OTP
- Earns commission after completion

### 🛡️ Admin
- Reviews and approves deals
- Sets commission distribution
- Verifies order proof
- Confirms delivery OTP
- Controls escrow release
- Handles disputes and reports

---

## 🔁 System Flow (High-Level)

1. Merchant creates deal → **PENDING**
2. Admin reviews and approves → **APPROVED**
3. Merchant pays advance → **ESCROW LOCKED**
4. Customer accepts deal (30-minute lock)
5. Customer submits order ID & proof
6. Admin verifies order → **ORDER VERIFIED**
7. Customer submits delivery OTP
8. Escrow released
9. Deal marked **COMPLETED**

---

## 🧠 System Architecture & Diagrams

### Data Flow Diagram (Level 0)
![DFD Level 0](docs/DFD-Level-0.jpeg)

### Overall System Architecture
![System Architecture](docs/System-Architecture.jpeg)

### Entity Relationship Diagram (ER)
![ER Diagram](docs/ER-Diagram.jpeg)

---

## ✨ Key Features

- 🔐 Escrow-based payment locking
- 👥 Role-based dashboards (Merchant / Customer / Admin)
- 💳 Razorpay payment gateway integration
- 💰 Wallet system with available & locked balance
- ⚡ Real-time updates using Socket.IO
- 🔑 OTP-based delivery confirmation
- 📜 Immutable transaction & wallet history
- 🛡️ Admin-controlled verification at every stage

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Socket.IO Server

### Payments
- Razorpay (Test Mode Supported)

### Deployment
- Frontend: Render
- Backend: Render

---

## 🔐 Test Credentials (Live Demo)

### 🛡️ Admin Login
> ⚠️ Admin account cannot be created from UI.

Email: admin@gmail.com

Password: 1234


### 🧑‍💼 Merchant / 🧑‍💻 Customer
- Can be created directly from the application UI using Register option.

---

## ⚙️ Run Locally

### Backend Setup
```bash
cd server
npm install
npm run dev

### Frontend Setup
cd client
npm install
npm run dev

