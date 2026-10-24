require('dotenv').config({ quiet: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const investorRoutes = require("./routes/investors");

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from backend/.env');
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/investors', investorRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Without this, malformed JSON bodies and unexpected errors get Express's HTML error page.
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body is not valid JSON' });
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    // Client errors such as "request entity too large" are safe and useful to show.
    res.status(status).json({ message: err.expose ? err.message : 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();