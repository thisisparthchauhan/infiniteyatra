// PM2 process config for the Infinite Yatra API.
// Usage on the VPS:  pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
    apps: [
        {
            name: 'infiniteyatra-api',
            script: 'src/index.js',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production',
                // Real values come from server/.env (loaded by dotenv). Keep
                // secrets out of this file — it's committed.
            },
        },
    ],
};
