import { MongoClient } from 'mongodb'

let clientPromise

function ensureClient() {
  if (clientPromise) return clientPromise
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  const client = new MongoClient(uri)
  if (process.env.NODE_ENV !== 'production') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    clientPromise = client.connect()
  }
  return clientPromise
}

export async function getDb(databaseName = 'all-data') {
  const connectedClient = await ensureClient()
  return connectedClient.db(databaseName)
}

export async function getCollection(collectionName, databaseName = 'all-data') {
  const db = await getDb(databaseName)
  return db.collection(collectionName)
}


