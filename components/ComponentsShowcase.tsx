import { components } from "@/lib/components";
import ComponentCard from "./gallery/ComponentCard";
import ViewAllCard from "./gallery/ViewAllCard";

export default function ComponentsShowcase() {
  const latest = components.slice(0, 5);
  if (latest.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 md:py-28">
      <header className="flex flex-col items-start gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          New
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Recently <span className="font-serif font-normal italic">launched</span>
        </h2>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {latest.map((item) => (
          <ComponentCard key={item.href} item={item} autoPlay />
        ))}
        <ViewAllCard count={components.length} />
      </div>
    </section>
  );
}
