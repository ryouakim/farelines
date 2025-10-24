import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/farelines'
const DB_NAME = process.env.DB_NAME || 'farelines'

async function seed() {
  const client = new MongoClient(MONGO_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(DB_NAME)
    
    // Create collections if they don't exist
    const collections = ['users', 'trips', 'priceAlerts', 'workerQueue']
    for (const collection of collections) {
      const exists = await db.listCollections({ name: collection }).hasNext()
      if (!exists) {
        await db.createCollection(collection)
        console.log(`Created collection: ${collection}`)
      }
    }
    
    // Create indexes
    console.log('Creating indexes...')
    
    // Users indexes
    const users = db.collection('users')
    await users.createIndex({ email: 1 }, { unique: true })
    
    // Trips indexes
    const trips = db.collection('trips')
    await trips.createIndex({ userEmail: 1 })
    await trips.createIndex({ status: 1, isArchived: 1 })
    await trips.createIndex({ needsCheck: 1 })
    await trips.createIndex({ updatedAt: -1 })
    await trips.createIndex({ gfHash: 1 })
    
    // Price alerts indexes
    const priceAlerts = db.collection('priceAlerts')
    await priceAlerts.createIndex({ tripId: 1 })
    await priceAlerts.createIndex({ userEmail: 1 })
    await priceAlerts.createIndex({ sentAt: -1 })
    
    // Worker queue indexes
    const workerQueue = db.collection('workerQueue')
    await workerQueue.createIndex({ status: 1, priority: -1, createdAt: 1 })
    await workerQueue.createIndex({ tripId: 1 })
    
    console.log('Indexes created successfully')
    
    // Insert sample data (optional)
    const sampleUser = {
      email: 'demo@example.com',
      name: 'Demo User',
      emailVerified: new Date(),
      marketingOptIn: false,
      notificationPreferences: {
        emailAlerts: true,
        priceDropThreshold: 1,
        frequency: 'immediate'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const existingUser = await users.findOne({ email: sampleUser.email })
    if (!existingUser) {
      await users.insertOne(sampleUser)
      console.log('Created demo user: demo@example.com')
      
      // Add sample trips for demo user
      const sampleTrips = [
        {
          userEmail: 'demo@example.com',
          tripName: 'Summer Vacation 2024',
          recordLocator: 'ABC123',
          paxCount: 2,
          ptc: 'ADT',
          paidPrice: 599,
          bookedPrice: 599,
          fareType: 'main_cabin',
          thresholdUsd: 50,
          googleFlightsUrl: 'https://www.google.com/flights#search;f=JFK;t=LAX;d=2024-07-15;r=2024-07-22',
          gfQuery: 'https://www.google.com/flights#search;f=JFK;t=LAX;d=2024-07-15;r=2024-07-22',
          gfHash: 'abc123hash',
          flights: [
            {
              flightNumber: 'AA 123',
              airline: 'AA',
              flightNumberNum: 123,
              date: '2024-07-15',
              origin: 'JFK',
              destination: 'LAX',
              departureTimeLocal: '08:00',
              departureTz: 'America/New_York'
            },
            {
              flightNumber: 'AA 456',
              airline: 'AA',
              flightNumberNum: 456,
              date: '2024-07-22',
              origin: 'LAX',
              destination: 'JFK',
              departureTimeLocal: '14:00',
              departureTz: 'America/Los_Angeles'
            }
          ],
          status: 'active',
          isArchived: false,
          needsCheck: true,
          lastCheckedPrice: 549,
          current_fare: 549,
          lowestSeen: 549,
          lastCheckedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userEmail: 'demo@example.com',
          tripName: 'Business Trip Chicago',
          recordLocator: 'XYZ789',
          paxCount: 1,
          ptc: 'ADT',
          paidPrice: 399,
          bookedPrice: 399,
          fareType: 'basic_economy',
          thresholdUsd: 25,
          flights: [
            {
              flightNumber: 'UA 789',
              airline: 'UA',
              flightNumberNum: 789,
              date: '2024-08-05',
              origin: 'SFO',
              destination: 'ORD',
              departureTimeLocal: '06:30',
              departureTz: 'America/Los_Angeles'
            }
          ],
          status: 'active',
          isArchived: false,
          needsCheck: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      await trips.insertMany(sampleTrips)
      console.log('Created sample trips')
    }
    
    console.log('✅ Database seeding completed successfully')
    
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// Run the seed function
seed()
