import * as Location from "expo-location";
import { useEffect, useState } from "react";

export default function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject>();
  const [rejected, setRejected] = useState<boolean>();

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();

      console.log("location permission", status);

      if (status !== "granted") {
        setRejected(true);

        return;
      }

      let location = await Location.getCurrentPositionAsync({
        mayShowUserSettingsDialog: false,
      });

      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  return [location, rejected] as const;
}
