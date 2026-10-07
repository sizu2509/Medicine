import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, ShieldCheck, Heart, Send, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const AboutPage: React.FC = () => {
  const { settings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-xs text-slate-600 leading-relaxed">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">About {settings.pharmacy_name}</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Setting the benchmark for pharmaceutical standards, safety, and digital health in Bangladesh.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-800">Our Mission</h2>
        <p>
          MediStock Pro operates as a licensed Model Pharmacy committed to eradicating counterfeit and sub-standard drugs. Every pharmaceutical formulation in our inventory is procured directly from certified manufacturers including Square Pharmaceuticals, Beximco Pharma, Incepta, and Renata.
        </p>
        <p>
          Our strict temperature-controlled warehouses and automated FEFO (First-Expire, First-Out) inventory system guarantee that patients always receive fresh, potent medicines with complete provenance and lot tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
          <div className="p-4 bg-emerald-50 rounded-2xl">
            <span className="text-2xl font-extrabold text-emerald-800 block">100%</span>
            <span className="font-semibold text-emerald-900 mt-1 block">Certified Genuine</span>
          </div>
          <div className="p-4 bg-teal-50 rounded-2xl">
            <span className="text-2xl font-extrabold text-teal-800 block">24/7</span>
            <span className="font-semibold text-teal-900 mt-1 block">Registered Pharmacists</span>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl">
            <span className="text-2xl font-extrabold text-blue-800 block">&le; 2 Hours</span>
            <span className="font-semibold text-blue-900 mt-1 block">Express Doorstep Care</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-xs">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Get in Touch</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Need emergency medicines, prescription advice, or corporate procurement assistance?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-800">Pharmacy Headquarters</h2>

          <div className="space-y-4 text-slate-600">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Physical Address:</strong>
                <span>{settings.address}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Hotlines:</strong>
                <span>{settings.phone}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Email:</strong>
                <span>{settings.email}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Operating Hours:</strong>
                <span>Open 24 hours, 7 days a week including public holidays</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-800 mb-4">Send Us a Message</h2>

          {submitted ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">Message Sent!</h4>
              <p className="text-emerald-700">A duty pharmacist will review and call you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="01712..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message or Prescription Request</label>
                <textarea
                  rows={3}
                  required
                  placeholder="How can we assist you today?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
