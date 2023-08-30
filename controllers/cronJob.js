const pool = require("../config/db");
const logger = require("../logger");
const pkg = require("geolib");

// Complete trip
const cronJobForEndTrip = async () => {
  const connection = await pool.getConnection();
  // console.log(validatedJson.device_id);
  try {
    const [tripSum] = await connection.query(
      "SELECT trip_id, device_id FROM trip_summary WHERE trip_status = ?",
      [0]
    );
    if (tripSum) {
      tripSum.forEach(async (row) => {
        const tripID = row.trip_id;

        // Fetch all data from tripdata related to this tripID
        const [tripdata] = await connection.query(
          "SELECT trip_id, event, timestamp, lat, lng, spd FROM tripdata WHERE trip_id = ? AND event = ? ORDER BY timestamp ASC",
          [tripID, "LOC"]
        );
        if (tripdata.length > 0) {
          let path = [];
          let tripStartTime = row.timestamp; // Set trip start time to the first timestamp
          let tripEndTime = tripdata[tripdata.length - 1].timestamp; // Set trip end time to the last timestamp
          let allSpd = [];
          let duration = 0;

          tripdata.forEach((item, index) => {
            // Set lat lng data
            if (item.event == "LOC") {
              let geodata = { latitude: item.lat, longitude: item.lng };
              path.push(geodata);
            }

            // Set speed data
            allSpd.push(item.spd);
          });

          // Set Max speed
          let maxSpd = 0;
          maxSpd = Math.max(...allSpd.map(parseFloat));
          if (maxSpd < 0) {
            maxSpd = 0;
          }

          // Set Avg speed
          const sumOfSpeed = allSpd.reduce(
            (acc, curr) => acc + parseFloat(curr),
            0
          );
          const avgSpd = Math.round(sumOfSpeed) / allSpd.length;
          const averageSpeed = avgSpd.toFixed(2);

          // Set Trip Total distance
          let distance = 0;
          const totalDistance = pkg.getPathLength(path); // In meters
          distance = totalDistance / 1000; // In Kms

          // Set Trip duration
          let difference = "";
          difference = tripEndTime - tripStartTime; // seconds
          let hours = Math.floor(difference / 3600);
          difference = difference % 3600;
          let minutes = Math.floor(difference / 60);
          difference = difference % 60;
          let seconds = difference;
          if (hours > 0) {
            duration =
              hours + " hours " + minutes + " Mins " + seconds + " Sec";
          } else {
            duration = minutes + " Mins " + seconds + " Sec";
          }

          let currentTime = Math.floor(+new Date() / 1000);
          let timeDiff = currentTime - tripEndTime;
          let timeDiffInMin = timeDiff / 60;

          if (parseInt(timeDiffInMin) > 30) {
            // Update to trip summary page
            const [updateTrip] = await pool.query(
              "UPDATE trip_summary SET trip_end_time = ?, total_distance = ?, duration = ?, avg_spd =?, max_spd = ?, trip_status =? WHERE trip_id = ?",
              [tripEndTime, distance, duration, avgSpd, maxSpd, 1, tripID]
            );

            console.log("Trip completed:", updateTrip);
          }
        } else {
          logger.info("Trip data not found for the Trip ID", tripID);
        }
      });
    }
  } catch (error) {
    logger.error(`Trip completion process failed! ${error}`);
  } finally {
    connection.release();
  }
};

module.exports = cronJobForEndTrip;
