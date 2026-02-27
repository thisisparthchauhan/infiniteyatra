// PM2 ecosystem config for Hostinger VPS deployment
// Run: pm2 start ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'infiniteyatra-client',
            cwd: './client',
            script: 'node_modules/.bin/next',
            args: 'start',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
        },
    ],
};
