import { runSocksServer } from ".";

const port = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 1080;
const host = process.env["HOST"] || "0.0.0.0";

runSocksServer({ port, host })
  .then((server) => {
    process.on("SIGINT", () => {
      console.log("SIGINT signal received: closing server...");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
