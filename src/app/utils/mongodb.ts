import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise: Promise<MongoClient>;

// Define a type for the global object with our custom property
interface CustomNodeJsGlobal {
  _mongoClientPromise?: Promise<MongoClient>;
}

// Use the correct type for the global object
const globalWithMongo = global as unknown as CustomNodeJsGlobal;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
