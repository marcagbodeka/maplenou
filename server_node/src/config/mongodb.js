const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const connectDB = async () => {
  if (client) return client;
  
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maplenou';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('maplenou');
    console.log('✅ Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

const getCollection = (collectionName) => {
  return getDb().collection(collectionName);
};

// Wrapper pour simuler l'interface MySQL
const query = async (collectionName, operation, ...args) => {
  const collection = getCollection(collectionName);
  
  switch (operation) {
    case 'find':
      const [filter, options] = args;
      return await collection.find(filter, options).toArray();
    
    case 'findOne':
      const [filterOne] = args;
      return await collection.findOne(filterOne);
    
    case 'insertOne':
      const [document] = args;
      const result = await collection.insertOne(document);
      return [{ insertId: result.insertedId }];
    
    case 'insertMany':
      const [documents] = args;
      const resultMany = await collection.insertMany(documents);
      return [{ insertId: resultMany.insertedIds }];
    
    case 'updateOne':
      const [filterUpdate, update, updateOptions] = args;
      return await collection.updateOne(filterUpdate, update, updateOptions);
    
    case 'updateMany':
      const [filterUpdateMany, updateMany, updateOptionsMany] = args;
      return await collection.updateMany(filterUpdateMany, updateMany, updateOptionsMany);
    
    case 'deleteOne':
      const [filterDelete] = args;
      return await collection.deleteOne(filterDelete);
    
    case 'deleteMany':
      const [filterDeleteMany] = args;
      return await collection.deleteMany(filterDeleteMany);
    
    case 'count':
      const [filterCount] = args;
      return await collection.countDocuments(filterCount);
    
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
};

module.exports = {
  connectDB,
  getDb,
  getCollection,
  query
};
