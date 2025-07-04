# LessBoard

[English](readme.md) | [正體中文](docs/readme.zh_TW.md)

LessBoard is an interactive message board website focused on the implementation and verification of web security design principles.

LessBoard is built on **stateless** and **serverless** design philosophies.

This project is the midterm assignment for the course "(2025 Spring) Practicum of Attacking and Defense of Network Security".

> **⚠️ Note: This is an assignment-oriented project. Its reliability and security must be carefully evaluated before being deployed in a production environment.**

## 🧾 Implemented Features

User registration, avatar upload, login, message posting, and message deletion.

## 🔐 Core Feature: Stateless Architecture

Unlike traditional login systems, LessBoard adopts a radically purist stateless design:

- The server maintains **no session state**. Login is "fake" — only simulated by the frontend via cached data.
- Every sensitive action (e.g., posting or deleting a message) requires re-authentication via HTTPS and Basic Auth.
- Each request is atomic and self-contained, adhering to the spirit of HTTP.
- While the system is stateless, it simulates CSRF tokens and session structures to confuse attackers and enhance security:
  - These tokens are checked for presence but not validated for authenticity.
- Through UX design and cached login information, the interface simulates a logged-in state for improved usability.

This design:

- Avoids cookies and JWTs entirely, making session hijacking or CSRF infeasible.
- Enforces re-authentication per request, increasing resistance to brute-force attacks.
- Aligns closely with RESTful, resource-oriented development principles.

## 📡 API Overview

The following APIs are designed in strict accordance with RESTful conventions:

- `POST /api/v1/users`: Register a new user
- `POST /api/v1/sessions`: Login (fake login, frontend-only state)
- `GET /api/v1/users/{username}/avatar`: Fetch user avatar
- `GET /api/v1/messages`: Retrieve all messages (public)
- `POST /api/v1/messages`: Post a new message (authentication required)
- `DELETE /api/v1/messages/{message_id}`: Delete a message (authentication required)

## 🌐 Cloudflare-Based Serverless Architecture

- **Cloudflare Workers** host both frontend and backend logic, handling static content and API requests.
- **Cloudflare KV** stores user data and messages.
- **Cloudflare R2** stores original avatar image files.
- **Cloudflare Images** performs image validation, size limiting, and content cleaning.

This setup ensures that:

- All backend logic is handled within Cloudflare Workers, inherently preventing CORS issues.
- The frontend is completely separated from data storage, eliminating the risk of SQL injection.
- No self-hosted servers or databases are used, reducing the attack surface and maintenance burden.

## 🛡️ Additional Security Design and Defenses

- Handcrafted using pure HTML / CSS / JavaScript without any frameworks — minimizing dependency vulnerabilities and controlling the attack surface.
- All inputs (including avatars and messages) are subject to strict frontend and backend **format validation** and **data sanitization**.
- All outputs are properly escaped to mitigate XSS.
- Passwords are hashed using **Bcrypt** to ensure secure storage.
