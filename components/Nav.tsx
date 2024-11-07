"use client";
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ModeToggle } from "./ModeToggle";
export default function Nav() {
  return (
    <div className="flex justify-between items-center p-4 ">
      <div>
        <p className="text-2xl font-bold">Hyper Stake</p>
        <p className="text-sm font-semibold">Cohort 3 project</p>
      </div>

      <div className="flex gap-4">
        <div className="flex justify-center items-center">
          <ModeToggle />
        </div>
        <div>
          <WalletMultiButton
            style={{
              color: "white",
              backgroundColor: "black",
              border: "1px solid white",
              borderRadius: "0.5rem",
            }}
          />
        </div>
      </div>
    </div>
  );
}
