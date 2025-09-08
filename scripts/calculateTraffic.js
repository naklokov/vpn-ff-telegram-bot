const listJson = require("./list.json");

const sortedUsersByMaxTraffic = () => {
  const inbounds = listJson?.obj?.[0]?.clientStats;
  const sorted = inbounds
    ?.map((i) => ({
      traffic: Math.round((i.up + i.down) / 1073693200),
      user: i.email,
    }))
    .sort((a, b) => b.traffic - a.traffic);
  return sorted;
};

console.log(sortedUsersByMaxTraffic());
