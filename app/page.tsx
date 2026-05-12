"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {units.map((unit) => (
        <div key={unit.label} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 min-w-[80px]">
          <div className="text-3xl md:text-4xl font-serif font-bold text-stone-800">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="text-sm text-stone-500 uppercase tracking-wider">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const weddingDate = new Date("2027-03-28T15:00:00"); // Adrian & Katelyn's wedding

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-stone-100">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-stone-500 uppercase tracking-[0.3em] text-sm mb-6">
            Together with our families
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-stone-900 mb-4">
            Adrian <span className="text-stone-400">&</span> Katelyn
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 font-light mb-8">
            Request the pleasure of your company at their wedding
          </p>
          <div className="w-16 h-px bg-stone-400 mx-auto mb-8" />
          <p className="text-lg md:text-xl text-stone-700 mb-2">
            Sunday, March 28th, 2027
          </p>
          <p className="text-stone-500 mb-12">3:00 PM · The Garden Estate</p>

          <div className="mb-12">
            <Countdown targetDate={weddingDate} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rsvp"
              className="inline-flex items-center justify-center px-8 py-4 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-700 transition-colors text-lg font-medium"
            >
              RSVP Now
            </Link>
            <Link
              href="/find-my-seat"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-stone-800 text-stone-800 rounded-lg hover:bg-stone-800 hover:text-stone-50 transition-colors text-lg font-medium"
            >
              Find My Seat
            </Link>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-8">The Details</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-stone-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-700 font-serif text-lg">1</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-serif mb-1">Tea Ceremony</h3>
                <p className="text-stone-500">1:00 PM · The Garden Room</p>
                <p className="text-stone-400 text-sm mt-1">An intimate gathering for family and close friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-stone-50 rounded-xl">
              <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center shrink-0">
                <span className="text-stone-700 font-serif text-lg">2</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-serif mb-1">Vow Ceremony</h3>
                <p className="text-stone-500">3:00 PM · The Garden Chapel</p>
                <p className="text-stone-400 text-sm mt-1">Where we say our vows and become husband and wife</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-stone-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-green-700 font-serif text-lg">3</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-serif mb-1">Reception</h3>
                <p className="text-stone-500">6:00 PM · The Grand Ballroom</p>
                <p className="text-stone-400 text-sm mt-1">Dinner, drinks, and dancing with everyone we love</p>
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif mb-2">The Garden Estate</h3>
              <p className="text-stone-500">123 Blossom Lane</p>
              <p className="text-stone-400 text-sm mt-1">All events at the same venue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-stone-400 text-sm bg-stone-50">
        <p>Adrian & Katelyn · March 28, 2027</p>
      </footer>
    </main>
  );
}
