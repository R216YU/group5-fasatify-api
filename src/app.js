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
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

server.get("/", (req, reply) => {
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
        region: "ja",
        type: "restaurant",
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    // データの加工
    const results = response.data.results.map((place) => {
      // 住所設定
      const splittedAddress = place.formatted_address.split(" ");
      splittedAddress.shift();
      const correctAddress = splittedAddress.join(" ");

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

server.listen({ port: process.env.PORT || 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening!`);
});
