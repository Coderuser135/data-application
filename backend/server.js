import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.config.js';
import { startMembershipExpiryJob } from './jobs/membershipExpiry.job.js';
import { validateJwtConfiguration } from './utils/jwt.utils.js';

const port = process.env.PORT || 5000;

validateJwtConfiguration();

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API server running on port ${port}`));
    startMembershipExpiryJob();
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
