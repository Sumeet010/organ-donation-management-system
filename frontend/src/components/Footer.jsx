import React from 'react';
import { HeartHandshake, Shield, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-base">OrganChain</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              A blockchain-secured national organ donation registry ensuring transparent, immutable, and verifiable donor records across all registered facilities.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Registry</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/donor" className="hover:text-white transition-colors">Register as Donor</Link></li>
              <li><Link to="/recipient" className="hover:text-white transition-colors">Patient Requests</Link></li>
              <li><Link to="/audit" className="hover:text-white transition-colors">Audit Logs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                registry@organchain.health
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                1800-XXX-XXXX (Toll Free)
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                HIPAA Compliant
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} OrganChain Registry. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>&bull;</span>
            <span>Terms of Service</span>
            <span>&bull;</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
