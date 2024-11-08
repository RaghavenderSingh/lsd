import Nav from "@/components/Nav";
import StakeCard from "@/components/StakeCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, black, #e84125)",
      }}
    >
      <Nav />
      <div className="flex justify-center items-center">
        <StakeCard />
      </div>
    </div>
  );
}
