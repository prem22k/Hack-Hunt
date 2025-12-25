import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Hackathon from './models/Hackathon';

const hackathons = [
  {
    title: "HackMIT 2025",
    organizer: "MIT",
    description: "Join 1000+ hackers for MIT's premier annual hackathon. Build innovative solutions over 24 hours.",
    startDate: new Date("2025-02-15"),
    endDate: new Date("2025-02-16"),
    location: "Cambridge, MA",
    mode: "offline",
    isPaid: false,
    prize: "$50,000",
    skills: ["React", "Python", "Machine Learning", "Web3"],
    registrationUrl: "https://hackmit.org",
    source: "mlh" // Assuming source for seed data
  },
  {
    title: "Global AI Hackathon",
    organizer: "Google Developer Groups",
    description: "Build AI-powered solutions to solve global challenges. Open to developers worldwide.",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-03-03"),
    location: "Virtual",
    mode: "online",
    isPaid: false,
    prize: "$100,000",
    skills: ["TensorFlow", "Python", "Cloud Computing", "NLP"],
    registrationUrl: "https://gdg.community.dev",
    source: "kaggle"
  },
  {
    title: "FinTech Innovation Challenge",
    organizer: "JP Morgan Chase",
    description: "Revolutionize financial services with cutting-edge technology solutions.",
    startDate: new Date("2025-03-20"),
    endDate: new Date("2025-03-22"),
    location: "New York, NY",
    mode: "hybrid",
    isPaid: false,
    prize: "$75,000",
    skills: ["Blockchain", "React", "Node.js", "Smart Contracts"],
    registrationUrl: "https://jpmorgan.com/hackathon",
    source: "devpost"
  },
  {
    title: "Health Tech Hack",
    organizer: "Stanford Medicine",
    description: "Create healthcare innovations that improve patient outcomes and medical research.",
    startDate: new Date("2025-04-05"),
    endDate: new Date("2025-04-07"),
    location: "Palo Alto, CA",
    mode: "offline",
    isPaid: true,
    prize: "$30,000",
    skills: ["Healthcare AI", "Mobile Development", "Data Science", "IoT"],
    registrationUrl: "https://stanford.edu/healthhack",
    source: "mlh"
  },
  {
    title: "Climate Action Hackathon",
    organizer: "UN Environment Programme",
    description: "Develop sustainable solutions to combat climate change and environmental challenges.",
    startDate: new Date("2025-04-22"),
    endDate: new Date("2025-04-24"),
    location: "Virtual",
    mode: "online",
    isPaid: false,
    prize: "$25,000",
    skills: ["Sustainability", "IoT", "Data Analytics", "GIS"],
    registrationUrl: "https://unep.org/hackathon",
    source: "kaggle"
  },
  {
    title: "EdTech Innovate",
    organizer: "Coursera & edX",
    description: "Transform education through technology. Build the future of learning.",
    startDate: new Date("2025-05-10"),
    endDate: new Date("2025-05-12"),
    location: "San Francisco, CA",
    mode: "hybrid",
    isPaid: false,
    prize: "$40,000",
    skills: ["EdTech", "LMS", "AI/ML", "Gamification"],
    registrationUrl: "https://edtechinnovate.com",
    source: "devpost"
  },
  {
    title: "Web3 Builders Summit",
    organizer: "Ethereum Foundation",
    description: "Build decentralized applications that shape the future of the internet.",
    startDate: new Date("2025-05-25"),
    endDate: new Date("2025-05-27"),
    location: "Denver, CO",
    mode: "offline",
    isPaid: true,
    prize: "$150,000",
    skills: ["Solidity", "Web3.js", "Smart Contracts", "DeFi"],
    registrationUrl: "https://ethereum.org/hackathon",
    source: "mlh"
  },
  {
    title: "Space Apps Challenge",
    organizer: "NASA",
    description: "Use NASA data to solve challenges on Earth and in space exploration.",
    startDate: new Date("2025-06-14"),
    endDate: new Date("2025-06-16"),
    location: "Virtual",
    mode: "online",
    isPaid: false,
    prize: "$20,000",
    skills: ["Data Science", "Python", "GIS", "Visualization"],
    registrationUrl: "https://nasa.gov/spaceapps",
    source: "kaggle"
  },
];

mongoose.connect(process.env.MONGODB_URI || '')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    try {
      await Hackathon.deleteMany({});
      console.log('Cleared existing hackathons');
      
      // @ts-ignore
      await Hackathon.insertMany(hackathons);
      console.log('Seeded hackathons');
      
      mongoose.connection.close();
    } catch (err) {
      console.error('Error seeding database:', err);
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
