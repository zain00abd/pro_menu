import { MongoClient } from 'mongodb'

let clientPromise
let lastConnectionTime = 0
const CONNECTION_TIMEOUT = 5 * 60 * 1000 // 5 دقائق

const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
}

function ensureClient() {
  const now = Date.now()
  
  // إعادة الاتصال إذا مر وقت طويل
  if (clientPromise && now - lastConnectionTime > CONNECTION_TIMEOUT) {
    console.log('MongoDB connection timeout, reconnecting...')
    clientPromise = null
    if (global._mongoClientPromise) {
      global._mongoClientPromise = null
    }
  }
  
  if (clientPromise) return clientPromise
  
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  
  const client = new MongoClient(uri, options)
  
  if (process.env.NODE_ENV !== 'production') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect()
        .then((connectedClient) => {
          console.log('MongoDB connected successfully (development)')
          lastConnectionTime = Date.now()
          return connectedClient
        })
        .catch((err) => {
          console.error('MongoDB connection error:', err)
          global._mongoClientPromise = null
          throw err
        })
    }
    clientPromise = global._mongoClientPromise
  } else {
    clientPromise = client.connect()
      .then((connectedClient) => {
        console.log('MongoDB connected successfully (production)')
        lastConnectionTime = Date.now()
        return connectedClient
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err)
        clientPromise = null
        throw err
      })
  }
  
  return clientPromise
}

export async function getDb(databaseName = 'all-data') {
  try {
    const connectedClient = await ensureClient()
    return connectedClient.db(databaseName)
  } catch (error) {
    console.error('Error getting database:', error)
    // إعادة المحاولة مرة واحدة
    clientPromise = null
    if (global._mongoClientPromise) {
      global._mongoClientPromise = null
    }
    const connectedClient = await ensureClient()
    return connectedClient.db(databaseName)
  }
}

export async function getCollection(collectionName, databaseName = 'all-data') {
  const db = await getDb(databaseName)
  return db.collection(collectionName)
}


