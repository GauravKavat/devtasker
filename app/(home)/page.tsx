import { Navbar } from "@/app/(home)/_components/navbar";
import HeroSection from "@/app/(home)/_components/hero-section";
import GetStarted from "@/app/(home)/_components/getStarted";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <GetStarted />
    </>
  );
}
