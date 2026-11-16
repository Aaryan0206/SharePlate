import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="py-24 bg-cream-50 min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-forest-800 text-sage-300 flex items-center justify-center mb-6 shadow-md">
        <UtensilsCrossed className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-charcoal-900 tracking-tight">404 — Page Not Found</h1>
      <p className="text-sm text-charcoal-600 mt-2 max-w-md">
        The plate you're looking for seems to have already been collected or doesn't exist.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="md" icon={ArrowLeft} iconPosition="left">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
