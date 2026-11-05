import { components } from "@/lib/components";
import ComponentCard from "./gallery/ComponentCard";
import ViewAllCard from "./gallery/ViewAllCard";

export default function ComponentsShowcase() {
  const latest = components.slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 md:py-28">
      <header className="flex flex-col items-start gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          New
        </span>
        <h2 className="font-runde text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Recently launched
        </h2>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((item) => (
          <ComponentCard key={item.href} item={item} autoPlay />
        ))}
        <ViewAllCard count={components.length} />
      </div>
    </section>
  );
}
