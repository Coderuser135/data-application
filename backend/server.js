import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.config.js';
import { startMembershipExpiryJob } from './jobs/membershipExpiry.job.js';

// Local development entry point. Vercel imports the Express app below
// and runs it as a serverless function instead of starting a long-lived server.
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(port, () => console.log(`API server running on port ${port}`));
      startMembershipExpiryJob();
    })
    .catch((error) => {
      console.error('Failed to start server', error);
      process.exit(1);
    });
}

export default app;
