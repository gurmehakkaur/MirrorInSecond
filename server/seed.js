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

  // Create projects
  const [housing, rewards, careers] = await Project.insertMany([
    {
      githubUrl: "https://github.com/acme/housing-service",
      roles: ["admin", "tenant", "reviewer"],
      dbSchema: {
        tenants:  ["id", "name", "unit", "rent", "status"],
        listings: ["id", "address", "price", "available"],
        leases:   ["leaseId", "tenantId", "start", "end"],
      },
    },
    {
      githubUrl: "https://github.com/acme/rewards-service",
      roles: ["user", "admin"],
      dbSchema: {
        users:       ["id", "name", "email", "points", "tier"],
        redemptions: ["id", "userId", "item", "pointsCost", "createdAt"],
      },
    },
    {
      githubUrl: "https://github.com/acme/careers-service",
      roles: ["reviewer", "candidate", "hiring_manager"],
      dbSchema: {
        jobs:       ["id", "title", "department", "open"],
        applicants: ["id", "name", "jobId", "status"],
        interviews: ["id", "applicantId", "date", "interviewer"],
      },
    },
  ]);

  console.log(`Seeded ${3} projects.`);

  // Create scenarios
  await Scenario.insertMany([
    {
      projectId: housing._id,
      scenario: "Admin approves pending housing application",
      role: "admin",
      userId: "alice@acme.com",
      userPassword: "synth_pass_alice_01",
      syntheticData: {
        tenants: [
          { name: "John Smith", unit: "4B", rent: 2400, status: "active" },
          { name: "Sara Lee",   unit: "7A", rent: 1950, status: "pending" },
        ],
        listings: [
          { id: "L001", address: "12 Oak St",    price: 320000, available: true },
          { id: "L002", address: "88 Maple Ave", price: 415000, available: false },
        ],
        leases: [
          { leaseId: "LS001", tenant: "John Smith", start: "2024-01-01", end: "2025-01-01" },
        ],
      },
      isLive: true,
    },
    {
      projectId: rewards._id,
      scenario: "User redeems points for gift card",
      role: "user",
      userId: "bob@acme.com",
      userPassword: "synth_pass_bob_02",
      syntheticData: {
        users: [
          { name: "Bob Chen",   points: 4500, tier: "gold" },
          { name: "Maya Patel", points: 1200, tier: "silver" },
        ],
        redemptions: [
          { id: "R001", user: "Bob Chen", item: "Gift Card $50", pointsCost: 2000 },
        ],
      },
      isLive: true,
    },
    {
      projectId: careers._id,
      scenario: "Reviewer screens senior engineer applicant",
      role: "reviewer",
      userId: "carol@acme.com",
      userPassword: "synth_pass_carol_03",
      syntheticData: {
        jobs: [
          { title: "Senior Engineer",  department: "Platform", open: true },
          { title: "Product Designer", department: "Design",   open: true },
        ],
        applicants: [
          { name: "Carol White", role: "Senior Engineer", status: "interview" },
        ],
        interviews: [
          { applicant: "Carol White", date: "2025-04-10", interviewer: "Dan Torres" },
        ],
      },
      isLive: false,
    },
  ]);

  console.log(`Seeded 3 scenarios.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
