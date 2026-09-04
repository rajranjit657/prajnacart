import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, CreditCard, Sparkles, HelpCircle, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#236B45] text-white text-xs border-t border-[#1b5234] pb-16 md:pb-0">
      {/* Marketplace Trust Badges */}
      <div className="bg-[#1b5234] border-b border-[#17462c] py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 text-novayellow-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">100% Genuine Products</p>
              <p className="text-gray-200 text-xs">Direct from verified brands & sellers</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 text-novayellow-400 flex items-center justify-center shrink-0">
              <RotateCcw size={22} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Easy Returns & Exchanges</p>
              <p className="text-gray-200 text-xs">Hassle-free 7-14 days replacement</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 text-novayellow-400 flex items-center justify-center shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Express Pan-India Delivery</p>
              <p className="text-gray-200 text-xs">Fast shipping with live GPS tracking</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 text-novayellow-400 flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Secure Online & COD</p>
              <p className="text-gray-200 text-xs">Protected with Razorpay 256-bit encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-[#1b5234] pb-10">
          {/* Column 1: About */}
          <div>
            <p className="text-novayellow-400 font-bold uppercase text-[11px] tracking-wider mb-3">ABOUT</p>
            <ul className="space-y-2 text-gray-200">
              <li><Link to="/products" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/seller/register" className="hover:text-white transition-colors">Become a Seller</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Careers & News</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Prajnacart Stories</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Corporate Information</Link></li>
            </ul>
          </div>

          {/* Column 2: Help */}
          <div>
            <p className="text-novayellow-400 font-bold uppercase text-[11px] tracking-wider mb-3">HELP</p>
            <ul className="space-y-2 text-gray-200">
              <li><Link to="/profile/orders" className="hover:text-white transition-colors">Payments & Refunds</Link></li>
              <li><Link to="/profile/orders" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/profile/orders" className="hover:text-white transition-colors">Cancellation & Returns</Link></li>
              <li><Link to="/profile/orders" className="hover:text-white transition-colors">FAQ & Customer Care</Link></li>
              <li><Link to="/profile/orders" className="hover:text-white transition-colors">Report Infringement</Link></li>
            </ul>
          </div>

          {/* Column 3: Consumer Policy */}
          <div>
            <p className="text-novayellow-400 font-bold uppercase text-[11px] tracking-wider mb-3">CONSUMER POLICY</p>
            <ul className="space-y-2 text-gray-200">
              <li><Link to="/products" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Terms Of Use</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Security & Privacy</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Sitemap</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Grievance Redressal</Link></li>
            </ul>
          </div>

          {/* Column 4: Mail Us */}
          <div className="md:border-l md:border-[#1b5234] md:pl-6">
            <p className="text-novayellow-400 font-bold uppercase text-[11px] tracking-wider mb-3">MAIL US:</p>
            <div className="text-gray-200 text-xs leading-relaxed space-y-1">
              <p>Prajnacart Internet Private Limited,</p>
              <p>Buildings Alyssa, Begonia & Clove Embassy Tech Village,</p>
              <p>Outer Ring Road, Devarabeesanahalli Village,</p>
              <p>Bengaluru, 560103, Karnataka, India</p>
              <p className="pt-2 text-white flex items-center gap-1.5 font-semibold">
                <Mail size={13} className="text-novayellow-400" /> support@prajnacart.com
              </p>
            </div>
          </div>

          {/* Column 5: Registered Office */}
          <div>
            <p className="text-novayellow-400 font-bold uppercase text-[11px] tracking-wider mb-3">REGISTERED OFFICE:</p>
            <div className="text-gray-200 text-xs leading-relaxed space-y-1">
              <p>Prajnacart Internet Private Limited,</p>
              <p>CIN : U51109KA2026PTC066107</p>
              <p>Telephone: <span className="text-white font-semibold">044-45614700 / 044-67415800</span></p>
              <p className="pt-2 text-white flex items-center gap-1.5 font-semibold">
                <Phone size={13} className="text-novayellow-400" /> 1800 202 9898 (Toll Free)
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Partners */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-wider">PRAJNA<span className="text-[#0066FF]">CART</span></span>
            <span>© 2026 Prajnacart.com. All Rights Reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="bg-[#1b5234] px-2 py-1 rounded text-white font-mono">VISA</span>
            <span className="bg-[#1b5234] px-2 py-1 rounded text-white font-mono">Mastercard</span>
            <span className="bg-[#1b5234] px-2 py-1 rounded text-white font-mono">RuPay</span>
            <span className="bg-[#1b5234] px-2 py-1 rounded text-white font-mono">UPI</span>
            <span className="bg-[#1b5234] px-2 py-1 rounded text-white font-mono">NetBanking</span>
            <span className="bg-[#1b5234] px-2 py-1 rounded text-novayellow-400 font-mono font-bold">COD Available</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
