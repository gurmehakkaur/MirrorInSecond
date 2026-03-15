const mongoose = require("mongoose");
const Project = require("./models/Project");
const Scenario = require("./models/Scenario");

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/mirrorinseconds";

async function seed() {
  await mongoose.connect(MONGODB_URL);
  console.log("Connected to MongoDB");

  const existing = await Project.countDocuments();
  if (existing > 0) {
    console.log(`Skipping seed — ${existing} projects already exist.`);
    await mongoose.disconnect();
    return;
  }

  // ── Demo project (seed only) ─────────────────────────────────────────────
  // NOTE: This project and its scenarios are for demonstration purposes only.
  // They are pre-populated to show what MirrorInSeconds looks like in action.

  const [demo] = await Project.insertMany([
    {
      githubUrl: "https://github.com/acme/bookings-service",
      roles: ["admin", "customer", "support"],
      dbSchema: {
        users:    ["id", "email", "password", "role", "name"],
        bookings: ["id", "userId", "serviceId", "date", "status"],
        services: ["id", "name", "duration", "price", "available"],
        payments: ["id", "bookingId", "amount", "status", "paidAt"],
      },
      roleCredentials: {
        admin:    { email: "admin@acme-demo.com",    password: "Demo@Admin2024"    },
        customer: { email: "customer@acme-demo.com", password: "Demo@Customer2024" },
        support:  { email: "support@acme-demo.com",  password: "Demo@Support2024"  },
      },
    },
  ]);

  console.log("Seeded 1 demo project.");

  await Scenario.insertMany([
    {
      projectId: demo._id,
      scenario: "Admin views all pending bookings",
      role: "admin",
      userId: "admin@acme-demo.com",
      userPassword: "Demo@Admin2024",
      syntheticData: {
        users: [
          { id: "u1", email: "admin@acme-demo.com", password: "Demo@Admin2024", role: "admin", name: "Alex Admin" },
          { id: "u2", email: "jane@example.com",    password: "pass123",        role: "customer", name: "Jane Doe" },
          { id: "u3", email: "tom@example.com",     password: "pass456",        role: "customer", name: "Tom Brooks" },
        ],
        bookings: [
          { id: "b1", userId: "u2", serviceId: "s1", date: "2025-08-10", status: "pending" },
          { id: "b2", userId: "u3", serviceId: "s2", date: "2025-08-12", status: "pending" },
          { id: "b3", userId: "u2", serviceId: "s3", date: "2025-08-15", status: "confirmed" },
        ],
        services: [
          { id: "s1", name: "Deep Tissue Massage", duration: 60, price: 90,  available: true },
          { id: "s2", name: "Hair Cut & Style",    duration: 45, price: 55,  available: true },
          { id: "s3", name: "Facial Treatment",    duration: 75, price: 110, available: true },
        ],
        payments: [
          { id: "p1", bookingId: "b3", amount: 110, status: "paid", paidAt: "2025-08-01" },
        ],
      },
      isLive: false,
    },
    {
      projectId: demo._id,
      scenario: "Customer books an available service",
      role: "customer",
      userId: "customer@acme-demo.com",
      userPassword: "Demo@Customer2024",
      syntheticData: {
        users: [
          { id: "u1", email: "customer@acme-demo.com", password: "Demo@Customer2024", role: "customer", name: "Chris Customer" },
        ],
        bookings: [],
        services: [
          { id: "s1", name: "Deep Tissue Massage", duration: 60, price: 90,  available: true },
          { id: "s2", name: "Hair Cut & Style",    duration: 45, price: 55,  available: true },
        ],
        payments: [],
      },
      isLive: false,
    },
    {
      projectId: demo._id,
      scenario: "Support resolves a disputed payment",
      role: "support",
      userId: "support@acme-demo.com",
      userPassword: "Demo@Support2024",
      syntheticData: {
        users: [
          { id: "u1", email: "support@acme-demo.com", password: "Demo@Support2024", role: "support", name: "Sam Support" },
          { id: "u2", email: "angry@example.com",     password: "pass789",          role: "customer", name: "Rita Furious" },
        ],
        bookings: [
          { id: "b1", userId: "u2", serviceId: "s1", date: "2025-07-20", status: "completed" },
        ],
        services: [
          { id: "s1", name: "Sports Massage", duration: 60, price: 85, available: true },
        ],
        payments: [
          { id: "p1", bookingId: "b1", amount: 85, status: "disputed", paidAt: "2025-07-20" },
        ],
      },
      isLive: false,
    },
    {
      projectId: demo._id,
      scenario: "Customer cancels an upcoming booking",
      role: "customer",
      userId: "customer@acme-demo.com",
      userPassword: "Demo@Customer2024",
      syntheticData: {
        users: [
          { id: "u1", email: "customer@acme-demo.com", password: "Demo@Customer2024", role: "customer", name: "Chris Customer" },
        ],
        bookings: [
          { id: "b1", userId: "u1", serviceId: "s1", date: "2025-09-05", status: "confirmed" },
        ],
        services: [
          { id: "s1", name: "Yoga Session", duration: 50, price: 40, available: true },
        ],
        payments: [
          { id: "p1", bookingId: "b1", amount: 40, status: "paid", paidAt: "2025-08-20" },
        ],
      },
      isLive: false,
    },
  ]);

  console.log("Seeded 4 demo scenarios.");
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
