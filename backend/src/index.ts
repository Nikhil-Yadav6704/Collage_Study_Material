import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { authLimiter, generalLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import departmentsRoutes from './routes/departments';
import subjectsRoutes from './routes/subjects';
import materialsRoutes from './routes/materials';
import uploadRoutes from './routes/upload';
import uploadRequestsRoutes from './routes/uploadRequests';
import guidelinesRoutes from './routes/guidelines';
import bookmarksRoutes from './routes/bookmarks';
import ratingsRoutes from './routes/ratings';
import notificationsRoutes from './routes/notifications';
import moderatorRequestsRoutes from './routes/moderatorRequests';
import adminUsersRoutes from './routes/admin/users';
import adminModeratorsRoutes from './routes/admin/moderators';
import adminContentRoutes from './routes/admin/content';
import adminTagsRoutes from './routes/admin/tags';
import adminAnalyticsRoutes from './routes/admin/analytics';
import adminSettingsRoutes from './routes/admin/settings';
import moderatorDashboardRoutes from './routes/moderator/dashboard';
import moderatorFeedbackRoutes from './routes/moderator/feedback';
import foldersRoutes from './routes/folders';
import moderatorColleagueRoutes from './routes/moderator/colleagues';



const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  // Strip any trailing slash from FRONTEND_URL before comparing
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
    // Allow requests with no origin (curl, mobile apps, Postman) and matching origins
    if (!origin || origin.replace(/\/$/, '') === allowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload-requests', uploadRequestsRoutes);
app.use('/api/guidelines', guidelinesRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/moderator-requests', moderatorRequestsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/moderators', adminModeratorsRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/tags', adminTagsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/moderator/dashboard', moderatorDashboardRoutes);
app.use('/api/moderator/feedback', moderatorFeedbackRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/moderator/colleagues', moderatorColleagueRoutes);



app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`EduVault API running on port ${PORT}`);
});

export default app;
