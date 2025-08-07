import { TextScroll } from "@/components/ui/text-scroll";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">
      <TextScroll
      className="font-display text-center text-4xl font-semibold tracking-tighter text-black dark:text-white md:text-7xl md:leading-[5rem]"
      text="{ DEV }  "
      default_velocity={1}
    />
    </div>
  );
}