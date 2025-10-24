import { MongoClient, Db, Collection } from 'mongodb'
import { Trip, User, PriceAlert, WorkerQueue } from '@/types/trip'

if (!process.env.MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local')
}

if (!process.env.DB_NAME) {
  throw new Error('Please define the DB_NAME environment variable inside .env.local')
}

const uri = process.env.MONGO_URI
const dbName = process.env.DB_NAME

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(uri)
  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getCollection<T>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase()
  return db.collection<T>(collectionName)
}

// Collection helpers
export const getTripsCollection = () => getCollection<Trip>('trips')
export const getUsersCollection = () => getCollection<User>('users')
export const getPriceAlertsCollection = () => getCollection<PriceAlert>('priceAlerts')
export const getWorkerQueueCollection = () => getCollection<WorkerQueue>('workerQueue')

// Ensure indexes
export async function ensureIndexes() {
  const { db } = await connectToDatabase()
  
  // Trips indexes
  const trips = db.collection('trips')
  await trips.createIndex({ userEmail: 1 })
  await trips.createIndex({ status: 1, isArchived: 1 })
  await trips.createIndex({ needsCheck: 1 })
  await trips.createIndex({ updatedAt: -1 })
  await trips.createIndex({ gfHash: 1 })
  
  // Users indexes
  const users = db.collection('users')
  await users.createIndex({ email: 1 }, { unique: true })
  
  // Price alerts indexes
  const priceAlerts = db.collection('priceAlerts')
  await priceAlerts.createIndex({ tripId: 1 })
  await priceAlerts.createIndex({ userEmail: 1 })
  await priceAlerts.createIndex({ sentAt: -1 })
  
  // Worker queue indexes
  const workerQueue = db.collection('workerQueue')
  await workerQueue.createIndex({ status: 1, priority: -1, createdAt: 1 })
  await workerQueue.createIndex({ tripId: 1 })
}
