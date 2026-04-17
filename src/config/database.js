const mongoose = require('mongoose');

const connectDatabase = async (uri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
};

module.exports = { connectDatabase };
