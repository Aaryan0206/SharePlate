import React from 'react';
import HeroSection from '../components/home/HeroSection';
import ImpactStats from '../components/home/ImpactStats';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedListings from '../components/home/FeaturedListings';
import PartnerSection from '../components/home/PartnerSection';
import SustainabilitySection from '../components/home/SustainabilitySection';
import Testimonials from '../components/home/Testimonials';
import CtaBanner from '../components/home/CtaBanner';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Impact Statistics */}
      <ImpactStats />

      {/* 3. How It Works (3 Steps) */}
      <HowItWorks />

      {/* 4. Featured Food Listings with Filter Pills & Detail Modal */}
      <FeaturedListings />

      {/* 5. Restaurants, Cafeterias & Community Partners */}
      <PartnerSection />

      {/* 6. Sustainability Impact & Environmental Ledger */}
      <SustainabilitySection />

      {/* 7. Community Testimonials & Stories */}
      <Testimonials />

      {/* 8. Call To Action Banner */}
      <CtaBanner />
    </div>
  );
}
