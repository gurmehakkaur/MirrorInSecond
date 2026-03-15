const mongoose = require("mongoose");
const Project = require("./models/Project");

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/mirrorinseconds";

const seedData = [
  {
    scenario: "Housing Service v2",
    githubUrl: "https://github.com/acme/housing-service",
    syntheticData: {
      tenants: [
        { name: "John Smith", unit: "4B", rent: 2400, status: "active" },
        { name: "Sara Lee",   unit: "7A", rent: 1950, status: "pending" },
      ],
      listings: [
        { id: "L001", address: "12 Oak St",    price: 320000, available: true  },
        { id: "L002", address: "88 Maple Ave", price: 415000, available: false },
      ],
      leases: [
        { leaseId: "LS001", tenant: "John Smith", start: "2024-01-01", end: "2025-01-01" },
      ],
    },
    role: "admin",
    userId: "alice@acme.com",
    userPassword: "synth_pass_alice_01",
    isLive: true,
  },
  {
    scenario: "Rewards MVP",
    githubUrl: "https://github.com/acme/rewards-service",
    syntheticData: {
      users: [
        { name: "Bob Chen",   points: 4500, tier: "gold"   },
        { name: "Maya Patel", points: 1200, tier: "silver" },
      ],
      redemptions: [
        { id: "R001", user: "Bob Chen", item: "Gift Card $50", pointsCost: 2000 },
      ],
    },
    role: "user",
    userId: "bob@acme.com",
    userPassword: "synth_pass_bob_02",
    isLive: true,
  },
  {
    scenario: "Careers Staging",
    githubUrl: "https://github.com/acme/careers-service",
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
    role: "reviewer",
    userId: "carol@acme.com",
    userPassword: "synth_pass_carol_03",
    isLive: false,
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URL);
  console.log("Connected to MongoDB");

  const existing = await Project.countDocuments();
  if (existing > 0) {
    console.log(`Skipping seed — ${existing} projects already exist.`);
  } else {
    await Project.insertMany(seedData);
    console.log(`Seeded ${seedData.length} projects.`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
