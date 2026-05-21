const mongoose = require('mongoose');
const User = require('../models/User');
const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meterflow');
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Api.deleteMany({}),
    ApiKey.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@meterflow.dev',
    password: 'Admin123!',
    role: 'admin',
    plan: 'enterprise',
  });

  // Create demo user
  const user = await User.create({
    name: 'Demo Developer',
    email: 'demo@meterflow.dev',
    password: 'Demo123!',
    role: 'owner',
    plan: 'pro',
    company: 'Acme Corp',
  });

  console.log('Created users');

  // Create APIs for demo user
  const apis = await Api.insertMany([
    {
      userId: user._id,
      name: 'Shopify',
      description: 'E-commerce product data and order management',
      baseUrl: 'https://dummyjson.com',
      category: 'ecommerce',
      icon: '🛍️',
      color: '#96bf48',
      status: 'active',
    },
    {
      userId: user._id,
      name: 'Weather API',
      description: 'Real-time weather data and forecasts',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      category: 'weather',
      icon: '🌤️',
      color: '#3b82f6',
      status: 'active',
    },
    {
      userId: user._id,
      name: 'CoinGecko',
      description: 'Cryptocurrency prices and market data',
      baseUrl: 'https://api.coingecko.com/api/v3',
      category: 'finance',
      icon: '💰',
      color: '#f59e0b',
      status: 'active',
    },
    {
      userId: user._id,
      name: 'PokéAPI',
      description: 'Pokémon game data and stats',
      baseUrl: 'https://pokeapi.co/api/v2',
      category: 'gaming',
      icon: '⚡',
      color: '#ef4444',
      status: 'active',
    },
  ]);

  console.log('Created APIs');

  // Create API keys
  for (const api of apis) {
    await ApiKey.create({
      apiId: api._id,
      userId: user._id,
      name: `${api.name} Production Key`,
      environment: 'live',
    });
  }

  console.log('Created API keys');
  console.log('\n✅ Seed complete!');
  console.log('Demo credentials:');
  console.log('  Email: demo@meterflow.dev');
  console.log('  Password: Demo123!');
  console.log('\nAdmin credentials:');
  console.log('  Email: admin@meterflow.dev');
  console.log('  Password: Admin123!');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
