const app = require("./app"); // Import the configured app
const http = require("http");
require("dotenv").config();
// // Get port from environment and store in Express.
// const port = process.env.PORT || 5000;
// app.set("port", port);


// Create HTTP server.
// const server = http.createServer(app);

// // Listen on provided port, on all network interfaces.
// server.listen(port,"0.0.0.0");

// server.on("listening", () => {
//   const addr = server.address();
//   const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
//   console.log("Listening on " + bind);
  
// });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} by ${process.env.USER}`);
});

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(port + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(port + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});
