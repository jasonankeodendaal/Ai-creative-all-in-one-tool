// This file is a workaround for development environments where process.env is not defined.
// It simulates the presence of the API_KEY environment variable.
// In a production deployment, this file should be replaced by a proper
// environment variable configuration provided by the hosting platform.
window.process = {
  env: {
    API_KEY: 'AIzaSyDULyQz95VY2iKn5L1OsfdXpUztb0Mmv48'
  }
};
