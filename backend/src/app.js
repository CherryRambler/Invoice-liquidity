require('dotenv').config({ quiet: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const invoiceRoutes = require("./routes/invoices");
const investorRoutes = require("./routes/investors");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/invoices', invoiceRoutes);
app.use('/api/investors', investorRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();