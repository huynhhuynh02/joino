# 🚀 Joino — Open-Source Enterprise Task Management

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22--LTS-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Joino** is a high-performance, **open-source project management platform** and a powerful **Wrike alternative**. Designed for teams that demand flexibility, speed, and a premium user experience, it serves as a comprehensive **self-hosted task management** solution for modern workflows.

[**Live Demo**](#) | [**Documentation**](#) | [**Report Bug**](https://github.com/yourusername/joino/issues)

---

### 🌟 High-Performance Productivity Tool
Joino is built to bridge the gap between complex enterprise tools and simple task lists. It's the perfect **open-source alternative to Asana, Monday.com, and Wrike**, featuring professional-grade tools for planning, execution, and monitoring.

## ✨ Features

- **🎯 Advanced Project Management**
  - Create projects, tasks, and subtasks with ease.
  - Multi-view system: **List**, **Kanban Board**, **Gantt Chart**, and **Spreadsheet Table**.
  - Drag-and-drop workflow for seamless task organization.

- **🤝 Premium Team Collaboration**
  - **Email Invitations:** Bring your team onboard in seconds.
  - **Rich Comments:** Discussion threads with @mentions.
  - **Activity Logs:** Track every change with a detailed audit trail.
  - **Role-Based Access (RBAC):** Admin, Manager, and Member permissions.

- **📊 Powerful Analytics & Reports**
  - Dynamic Dashboards with real-time stats.
  - **Workload Management:** Monitor team capacity and performance.
  - **Time Tracking:** Log hours directly on tasks with automatic summaries.

- **🛠️ Extensibility & Customization**
  - **Custom Fields:** Tailor tasks to your specific business needs (Text, Number, Date, Dropdown, etc.).
  - **Labels & Tags:** Categorize work with vibrant color-coded labels.
  - **Global Search:** Blazing fast search using Cmd+K command palette.

- **🔒 Enterprise-Grade Security**
  - Secure JWT-based authentication.
  - **Google OAuth:** One-click login.
  - Robust password recovery and invitation workflows.
  - Dark Mode support with a polished, premium aesthetic.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16.2 (App Router), React 19.2, Tailwind CSS 3.4, shadcn/ui, Zustand, TanStack Query.
- **Backend:** Node.js 22, Express 5.2, Prisma 6.2 (ORM).
- **Database:** PostgreSQL.
- **Infrastructure:** Docker, Docker Compose.
- **Email:** Nodemailer (MailHog for local development).

---

## ⚡ Quick Start with Docker

The fastest way to get Joino running is using Docker.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/joino.git
   cd joino
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Launch the platform:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:4000](http://localhost:4000)
   - **Email Preview (MailHog):** [http://localhost:8025](http://localhost:8025)

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard Preview](https://raw.githubusercontent.com/yourusername/joino/main/assets/dashboard.png)

### Multi-View Task Management
![Views Preview](https://raw.githubusercontent.com/yourusername/joino/main/assets/views.png)

### Team Collaboration & Inbox
![Team Preview](https://raw.githubusercontent.com/yourusername/joino/main/assets/team.png)

---

## 🗺️ Roadmap

- [x] v1.0 Core Auth & Task Management
- [x] Integrated Time Tracking & Custom Fields
- [ ] Mobile Application (React Native)
- [ ] AI-Powered Task Summaries & Insights
- [ ] Third-party Integrations (Slack, GitHub, Calendar)

---

## 🤝 Contributing

We welcome contributions! Whether it's a bug report, a feature request, or a pull request, your help makes Joino better.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📞 Contact

Joino - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/joino](https://github.com/yourusername/joino)

---
*Developed with ❤️ by the Joino Team.*
