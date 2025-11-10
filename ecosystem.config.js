module.exports = {
  apps: [{
    name: 'heremylinks',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    env: {
      PORT: 4000,
      NODE_ENV: 'production'
    }
  }]
}
