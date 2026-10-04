import "dotenv/config";
import app from "./app.mjs";

const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => {
  console.log(`Property Listing API listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    console.log("Property Listing API stopped");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
