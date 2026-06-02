import { createApp } from './app.js';
import { config, checkConfig } from './config/index.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`\n🛞  Rollr API listening on http://localhost:${config.port}`);
  console.log(`   env: ${config.env}`);

  const problems = checkConfig();
  if (problems.length) {
    console.warn('\n⚠️  Heads up — these still use placeholder values:');
    problems.forEach((p) => console.warn('   - ' + p));
    console.warn('   Auth & database calls will fail until you add real Supabase keys to backend/.env\n');
  }
});
