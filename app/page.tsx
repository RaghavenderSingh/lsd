import Nav from "@/components/Nav";
import StakeCard from "@/components/StakeCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="">
      <Nav />
      <div className="flex justify-center items-center">
        <StakeCard />
      </div>
    </div>
  );
}
