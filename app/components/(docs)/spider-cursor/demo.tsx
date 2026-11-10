"use client";

import { useState } from "react";
import { SpiderCursor } from "@/components/ui/spider-cursor";

const STATS = [
  ["1,204", "cats pulled out of trees"],
  ["0", "months of rent paid on time"],
  ["3", "identical guys pointing at me"],
  ["29 min", "average pizza delivery, one minute too late"],
];

const POWERS = [
  ["Wall-crawling", "Great for stakeouts. Terrible for touchscreens."],
  ["Spider-sense", "Tingles before danger, landlords, and group projects."],
  ["Web fluid", "Homemade. Dissolves in one hour, same as my confidence."],
  ["Super strength", "Can lift a bus. Cannot open a pickle jar while anyone is watching."],
];

const COLUMNS = [
  ["todo", "To do"],
  ["doing", "Swinging on it"],
  ["done", "Done-ish"],
];

const TASKS = [
  { id: "casserole", text: "Return Aunt May's casserole dish", col: "todo" },
  { id: "rhino", text: "Fight a grown man dressed as a rhino", col: "todo" },
  { id: "pointing", text: "Find out who keeps pointing at me", col: "todo" },
  { id: "photos", text: "Sell photos of myself to my own boss", col: "doing" },
  { id: "suit", text: "Explain the suit smell to the dry cleaner", col: "doing" },
  { id: "homework", text: "Homework, due yesterday", col: "done" },
];

const REVIEWS = [
  ["A menace. I want pictures of him, and I want them cheap.", "A newspaper editor"],
  ["He webbed my car door shut during a rescue. Five stars.", "Guy in Queens"],
  ["We are not the same person. Please stop asking.", "A different spider guy"],
];

const PLANS = [
  ["Friendly", "$0", "You get waved at from a rooftop."],
  ["Neighborhood", "1 slice", "One rescue and up to four quips."],
  ["Amazing", "My rent", "Full-time hero. May cry on your fire escape."],
];

const RED = "rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white";
const GHOST = "rounded-full border px-4 py-2 text-sm font-medium";

export default function SpiderCursorDemo() {
  const [tasks, setTasks] = useState(TASKS);

  return (
    <div className="relative flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-6">
      <SpiderCursor
        className="h-[560px] w-full max-w-3xl rounded-2xl border"
        onWebDrop={(item, zone) => {
          const col = zone?.dataset.webDrop;
          if (col) setTasks((prev) => prev.map((t) => (t.id === item.dataset.webDrag ? { ...t, col } : t)));
        }}
      >
        <nav className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-sm font-semibold">webhead.nyc</span>
          <span className="hidden gap-5 text-sm text-muted-foreground sm:flex">
            <a>Powers</a>
            <a>Patrol</a>
            <a>Rates</a>
          </span>
          <button className={RED}>Hire me</button>
        </nav>

        <section className="px-6 py-16 text-center">
          <p className="text-xs text-muted-foreground">Now swinging in all five boroughs*</p>
          <h1 className="mx-auto mt-3 max-w-md text-4xl font-semibold tracking-tight">
            Your friendly neighborhood web developer.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
            I do whatever a spider can. So far that is sticking to walls, shipping on Fridays, and
            being late to everything.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button className={RED}>Book a rescue</button>
            <button className={GHOST}>Watch me miss a bus</button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">*Staten Island by ferry only. I cannot swing over water.</p>
        </section>

        <section className="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="bg-background px-4 py-6 text-center">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </section>

        <section className="px-6 py-14">
          <h2 className="text-xl font-semibold">What one radioactive bite gets you</h2>
          <p className="mt-1 text-sm text-muted-foreground">No refunds. The spider is unavailable for comment.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {POWERS.map(([title, body]) => (
              <div key={title} className="rounded-xl border p-4">
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40 px-6 py-14">
          <h2 className="text-xl font-semibold">Today&apos;s patrol board</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grab a card and haul it to another column. Yes, with a web. I do not own a mouse.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {COLUMNS.map(([id, title]) => (
              <div key={id} data-web-drop={id} className="min-h-48 rounded-xl border bg-background p-2">
                <h3 className="px-1 pb-2 text-xs font-medium text-muted-foreground">{title}</h3>
                <div className="flex flex-col gap-2">
                  {tasks
                    .filter((t) => t.col === id)
                    .map((t) => (
                      <div
                        key={t.id}
                        data-web-drag={t.id}
                        className="relative rounded-lg border bg-background p-2 text-xs shadow-sm select-none"
                      >
                        {t.text}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-14">
          <h2 className="text-xl font-semibold">People are saying things</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {REVIEWS.map(([quote, who]) => (
              <figure key={who} className="rounded-xl border p-4">
                <blockquote className="text-sm">{quote}</blockquote>
                <figcaption className="mt-3 text-xs text-muted-foreground">{who}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-t px-6 py-14">
          <h2 className="text-xl font-semibold">Rates</h2>
          <p className="mt-1 text-sm text-muted-foreground">Billed per swing. Web fluid sold separately.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PLANS.map(([name, price, perk], i) => (
              <div key={name} className="flex flex-col rounded-xl border p-4">
                <h3 className="text-sm font-medium">{name}</h3>
                <div className="mt-2 text-2xl font-semibold">{price}</div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{perk}</p>
                <button className={`mt-4 ${i === 1 ? RED : GHOST}`}>Choose</button>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t px-6 py-16 text-center">
          <h2 className="mx-auto max-w-sm text-2xl font-semibold tracking-tight">
            With great power comes a great electricity bill.
          </h2>
          <button className={`mt-6 ${RED}`}>Fund the web fluid</button>
        </section>

        <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
          Not affiliated with any spider, radioactive or otherwise. Do not try the wall thing at home.
        </footer>
      </SpiderCursor>
      <span className="text-xs text-muted-foreground select-none">
        Scroll to swing, click to throw webs, drag a patrol card
      </span>
    </div>
  );
}
