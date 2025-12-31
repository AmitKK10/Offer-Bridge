🚀 Offer Bridge – Escrow-Based Deal & Payment Platform

Offer Bridge is a full-stack MERN platform that connects merchants without credit cards to customers who own credit cards, enabling secure, verified, and commission-based purchases using an escrow payment model.

📌 Problem Statement

Many users miss out on card-based discounts because they do not own credit cards.

Many credit card holders do not fully utilize their card benefits.

There is no trusted system to safely connect these two groups.

💡 Solution

Offer Bridge provides a secure, admin-controlled escrow platform where:

Merchants request purchases

Customers place orders using their credit cards

Admin verifies every step

Payments are released only after successful delivery

🧠 Key Features

🔐 Escrow-based payment system

🛡️ Admin verification at every critical stage

👥 Role-based access (Merchant / Customer / Admin)

💰 Wallet system with locked & available balance

⚡ Real-time updates using Socket.IO

💳 Razorpay payment gateway integration

📜 Complete transaction & audit history

👥 User Roles
🧑‍💼 Merchant

Creates deals without immediate payment

Pays advance only after admin approval

Tracks order status and delivery OTP

Receives settlement after deal completion

🧑‍💻 Customer

Views approved & funded deals

Accepts deals with time-based locking

Places order using credit card

Earns commission after successful delivery

🛡️ Admin

Reviews and approves deals

Sets commission distribution

Verifies order proof and delivery OTP

Controls escrow release and wallets

🔁 System Flow (One-Page Summary)

Merchant creates a deal → PENDING

Admin reviews and approves → APPROVED

Merchant pays advance via Razorpay → ESCROW LOCKED

Customer accepts deal (30-min lock)

Customer submits order ID & proof

Admin verifies order → ORDER VERIFIED

Customer submits delivery OTP

Escrow released → commissions credited

Deal marked COMPLETED

💳 Payment & Wallet System

Razorpay is used for advance payments

Advance amount is stored in escrow wallet

Wallet tracks:

Available balance

Locked balance

Transaction history

Funds are released only after successful delivery confirmation

⚡ Real-Time System

Implemented using Socket.IO

Live updates for:

Deal status changes

Wallet balance updates

OTP visibility

Role-based socket rooms:

ADMIN

USER_<id>

🧱 Tech Stack
Frontend

React (Vite)

Tailwind CSS

Axios

Socket.IO Client

Backend

Node.js

Express.js

MongoDB (Atlas)

JWT Authentication

Socket.IO Server

Payments

Razorpay (Test & Live mode supported)

Deployment

Backend: Render (Web Service)

Frontend: Render (Static Site)

🔐 Security Features

JWT-based authentication

Role-based route protection

Admin-controlled verification

Escrow payment locking

Secure wallet ledger system

🧪 Test Mode Notes

Razorpay test credentials supported

Fake order IDs & OTPs allowed in test mode

No real money involved during testing
