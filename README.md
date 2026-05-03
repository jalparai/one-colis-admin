# One Colis — Admin Platform

A multi-role logistics management platform built for [OneColis](https://onecolis.net/en), a Moroccan e-commerce shipping company that empowers sellers with Cash on Delivery, real-time shipment tracking, and next-day payouts across Morocco.

**Live site:** [onecolis.net](https://onecolis.net/en)

---

## Overview

OneColis needed a unified admin system to manage the full logistics pipeline — from shipment creation to warehouse handling to financial payouts. The challenge was designing and building **6 separate role-based dashboards**, each with its own permissions, data views, and workflows, without a complete specification from the client.

I had to independently reverse-engineer the business logic for each role by studying the live platform, understanding how data flowed between roles, and making architectural decisions without direct guidance.

## Role-based dashboards

| Role | Responsibility |
|------|---------------|
| **Admin** | Full platform oversight — users, analytics, configurations |
| **Agent** | Field operations — shipment pickups and delivery coordination |
| **Employee** | Internal task and order management |
| **Payout** | Financial workflows — COD collection, commission tracking, payout scheduling |
| **Seller** | Seller-facing dashboard — shipment creation, tracking, revenue overview |
| **Warehouse** | Inventory and parcel management across warehouse locations |

## Technical highlights

- Built entirely in **TypeScript** with Next.js App Router — strict typing enforced across all 6 dashboards
- Implemented **role-based access control** — each role sees only the data and actions relevant to their function
- Integrated **shadcn/ui** component library for consistent, accessible UI across all panels
- Used **Next.js middleware** for route protection and role-based redirects at the edge
- Consumed **RESTful APIs** for real-time order status, financial data, and shipment tracking
- Designed and built without complete client specifications — required independent exploration of the business domain and proactive decision-making on data architecture

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Auth & Routing:** Next.js Middleware
- **Deployment:** Vercel

## What I learned

This project pushed me beyond typical frontend work. Without a full spec, I had to understand the *business* before I could build the *interface* — mapping out how an agent's actions affect a warehouse's view, or how a payout admin's dashboard needs to reflect a seller's COD collection in real time. It reinforced that good frontend engineering requires understanding the entire system, not just the UI layer.
