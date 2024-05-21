import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import axios from "axios";
import * as dotenv from "dotenv";
import { createClient } from "@google/maps";

dotenv.config();

const server = fastify();

server.register(fastifyCors, {
  origin: "*", // すべてのオリジンを許可
  methods: ["GET"],
});

server.get("/", (req, reply) => {
  return reply.send("田村教室 group5");
});

// ランドマークから緯度・経度の取得
const getGeocodeByAddress = async (address) => {
  const googleMapsClient = createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
    Promise: Promise,
  });

  try {
    const response = await googleMapsClient.geocode({ address }).asPromise();
    const { lat, lng } = response.json.results[0].geometry.location;

    return { lat, lng };
  } catch (error) {
    return address + "から緯度・経度の取得ができませんでした。";
  }
};

// GOOGLE MAP APIS
server.get("/search", async (req, reply) => {
  // クエリーパラメーターから場所、キーワード、半径を取得
  const { location, keyword, radius } = req.query;

  // 初期値の設定
  const { lat, lng } = await getGeocodeByAddress(location);
  const locationValue = location !== undefined ? lat + "," + lng : "35.681236,139.767125"; //default 東京駅
  const keywordValue = keyword !== undefined ? keyword : "飲食店";
  const radiusValue = radius !== undefined ? radius : "1000";

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: locationValue,
        keyword: keywordValue,
        radius: radiusValue,
        language: "ja",
        type: "restaurant",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    // データの加工
    const res = response.data.results.map((place) => {
      return {
        placeId: place.place_id,
        name: place.name,
        phone: place.tel,
        address: place.vicinity,
        googleMap: `https://www.google.com/maps/search/${place.name}${place.vicinity}`,
      };
    });
    return reply.send(res);
  } catch (error) {
    return reply.status(500).send({ error: "Something went wrong" });
  }
});

server.listen({ port: process.env.PORT || 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
