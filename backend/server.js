const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static HLS files
app.use('/hls', express.static(path.join(__dirname, 'public/hls'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.m3u8')) {
            res.set('Cache-Control', 'no-cache, no-store');
        } else {
            res.set('Cache-Control', 'public, max-age=31536000'); // segments
        }
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Serve static thumbnails
app.use('/thumbnails', express.static(path.join(__dirname, 'public/thumbnails'), {
    setHeaders: (res, filePath) => {
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Serve static avatars
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars'), {
    setHeaders: (res, filePath) => {
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Route files
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const adminRoutes = require('./routes/adminRoutes');
const videoRoutes = require('./routes/videoRoutes');
const commentRoutes = require('./routes/commentRoutes');
//const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const metadataRoutes = require('./routes/metadataRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api', commentRoutes);
//app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/metadata', metadataRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend_dist')));

// SPA fallback for any route not caught by API or static files
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend_dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
