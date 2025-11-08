import mongoose from 'mongoose';

export const initMongoose = async (uri: string) => {
  if (!uri) throw new Error('MONGODB_URI not provided');

  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  await mongoose.connect(uri, {
    // @ts-ignore
    useNewUrlParser: true,
    // @ts-ignore
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 sec
  });

  mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected'));
  mongoose.connection.on('error', (err) => console.error('🔴 Mongoose error:', err.message));
  mongoose.connection.on('disconnected', () => console.log('🟠 Mongoose disconnected'));

  return mongoose.connection;
};

export const closeMongoose = async () => {
  await mongoose.disconnect();
  console.log('🔒 Mongoose disconnected cleanly');
};
