module.exports = {
  apps: [
    {
      name: 'gsc-connect-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/gsc-connect',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/gsc-connect-web-error.log',
      out_file: '/var/log/pm2/gsc-connect-web-out.log',
    },
    {
      name: 'gsc-connect-mcp',
      script: 'dist/mcp/server.js',
      cwd: '/var/www/gsc-connect',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/gsc-connect-mcp-error.log',
      out_file: '/var/log/pm2/gsc-connect-mcp-out.log',
    },
  ],
};
