/**
 * TrafficLight — Red → Yellow → Green sequence with sound.
 *
 * Activated when racingState transitions to STANDBY.
 * On START: plays red→yellow→green sequence, then triggers GO.
 */
"use client";

import { useEffect, useState } from "react";
import { useRacingStore } from "@/store/racingStore";
import { soundManager } from "@/lib/sounds";

type LightState = "off" | "red" | "yellow" | "green";

export default function TrafficLight() {
  const racingState = useRacingStore((s) => s.racingState);
  const [lightState, setLightState] = useState<LightState>("off");

  useEffect(() => {
    if (racingState === "STANDBY") {
      setLightState("red");
      soundManager.playRedLight();
    } else if (racingState === "RACING") {
      // Sequence: red (already on) → yellow → green
      setLightState("red");

      const t1 = setTimeout(() => {
        setLightState("yellow");
        soundManager.playYellowLight();
      }, 500);

      const t2 = setTimeout(() => {
        setLightState("green");
        soundManager.playGreenLight();
      }, 1000);

      const t3 = setTimeout(() => {
        soundManager.playRaceStart();
      }, 1200);

      // Keep green lit during racing
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (racingState === "FINISHED" || racingState === "IDLE") {
      setLightState("off");
    }
  }, [racingState]);

  return (
    <div className="traffic-light" id="traffic-light">
      <div
        className={`traffic-light__bulb traffic-light__bulb--red ${
          lightState === "red" ? "active" : ""
        }`}
      />
      <div
        className={`traffic-light__bulb traffic-light__bulb--yellow ${
          lightState === "yellow" ? "active" : ""
        }`}
      />
      <div
        className={`traffic-light__bulb traffic-light__bulb--green ${
          lightState === "green" ? "active" : ""
        }`}
      />
    </div>
  );
}
