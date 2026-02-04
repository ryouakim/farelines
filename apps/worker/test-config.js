const config = require('./config');
console.log('✅ Config loaded successfully');
console.log('Amadeus API Key exists:', !!config.AMADEUS.API_KEY);
console.log('Database:', config.DB_NAME);
console.log('MongoDB URI exists:', !!config.MONGO_URI);
