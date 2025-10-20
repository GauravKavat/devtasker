import { Navbar } from "@/components/custom/navbar";
import Hero from "@/components/custom/hero";
import FeaturesBento from "@/components/custom/featuresBento";
import GetStarted from "@/components/custom/getStarted";

export default function Home() {
  return (
    <>
      <Navbar />
      <div>
        <Hero />
        <FeaturesBento />
      </div>
      <GetStarted />
    </>
  );
}
