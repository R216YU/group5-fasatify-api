import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const server = fastify();

server.register(fastifyCors, {
  origin: "*", // すべてのオリジンを許可
  methods: ["GET"],
});

const END_POINT = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const API_KEY = "AIzaSyDcrAzNG_DKUgZS2NXXrNGq4Ah6uBpDjK4";

server.get("/", (request, reply) => {
  return reply.send("田村教室 group5 group-work-api");
});

// GOOGLE MAP APIS
server.get("/search", async (req, reply) => {
  // クエリーパラメーターから場所、キーワードを取得
  const { location, keyword } = req.query;

  const locationValue = location != undefined ? location : "";
  const keywordValue = keyword != undefined ? keyword : "";

  try {
    const response = await axios.get(END_POINT, {
      params: {
        query: `${locationValue}+${keywordValue}`,
        language: "ja",
        type: "restaurant",
        key: API_KEY,
      },
    });

    // データの加工
    const results = response.data.results.map((place) => {
      const splitedAddress = place.formatted_address.split(" ");
      splitedAddress.shift();
      const correctAddress = splitedAddress.join(" ");

      return {
        placeId: place.place_id,
        name: place.name,
        address: correctAddress,
        googleMap: `https://www.google.com/maps/search/${place.name}+${correctAddress}`,
      };
    });

    return reply.send(results);
  } catch (error) {
    return reply.status(500).send({ error: "Something went wrong" });
  }
});

server.listen(
  { port: process.env.PORT || 8080, host: "0.0.0.0" },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening!`);
  }
);
