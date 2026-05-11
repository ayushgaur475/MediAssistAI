import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Phone, 
  MapPin, 
  Ambulance, 
  ShieldAlert, 
  Clock, 
  HeartPulse,
  Navigation,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const EMERGENCY_CONTACTS = [
  { name: "National Emergency", number: "112", icon: Phone, color: "bg-red-500" },
  { name: "Ambulance", number: "102", icon: Ambulance, color: "bg-orange-500" },
  { name: "Police", number: "100", icon: ShieldAlert, color: "bg-blue-500" },
  { name: "Blood Bank", number: "104", icon: HeartPulse, color: "bg-rose-600" }
];

const QUICK_ACTIONS = [
  { 
    title: "Nearby ERs", 
    desc: "Find nearest Emergency Rooms", 
    icon: MapPin,
    action: "View on Map" 
  },
  { 
    title: "First Aid Guide", 
    desc: "Basic life support steps", 
    icon: Clock,
    action: "Open Guide" 
  }
];

export default function Emergency() {
  return (
    <div className="min-h-[calc(100vh-96px)] bg-[var(--bg-main)] p-4 md:p-8 font-['Outfit'] text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header - Urgent Alert Style */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/20 p-8 md:p-12">
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-black uppercase tracking-widest text-xs">Emergency Response Portal</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
              Critical <span className="text-red-500">Care</span> Support
            </h1>
            <p className="text-[var(--text-muted)] font-medium max-w-xl text-lg">
              Immediate access to life-saving resources and emergency contacts. Stay calm, help is just a click away.
            </p>
          </div>
          
          {/* Background decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Emergency Contacts Card */}
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-red-500 rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Direct Dial</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {EMERGENCY_CONTACTS.map((contact, i) => (
                <motion.a
                  key={i}
                  href={`tel:${contact.number}`}
                  whileHover={{ x: 10 }}
                  className="flex items-center justify-between p-5 bg-white/5 hover:bg-red-500/10 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${contact.color} text-white shadow-lg`}>
                      <contact.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-tight">{contact.name}</h3>
                      <p className="text-xl font-black text-white group-hover:text-red-500 transition-colors">{contact.number}</p>
                    </div>
                  </div>
                  <Phone className="text-white/20 group-hover:text-red-500 transition-colors" size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Actions & Locations */}
          <div className="space-y-6">
            
            {/* Nearby Hospital Quick Link */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
                <h2 className="text-xl font-black uppercase tracking-tighter">Nearest Help</h2>
              </div>
              
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-6 text-center">
                <div className="w-16 h-16 bg-cyan-400/10 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-4">
                  <Navigation size={32} />
                </div>
                <h3 className="font-bold uppercase tracking-tight mb-1">Locate Nearest Hospital</h3>
                <p className="text-xs text-[var(--text-muted)] mb-6">Real-time GPS tracking to find the quickest route to an ER.</p>
                <Link 
                  to="/map"
                  className="w-full py-4 bg-cyan-400 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-400/20 block text-center"
                >
                  Open Emergency Map
                </Link>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] px-2">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>Avg Response: 8-12 Mins</span>
                </div>
                <span>Status: Active</span>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="grid grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((item, i) => (
                <div key={i} className="glass-card p-6 rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="p-3 bg-white/5 rounded-xl text-[var(--text-muted)] group-hover:text-white transition-colors w-fit mb-4">
                    <item.icon size={20} />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-tight mb-1">{item.title}</h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium mb-4">{item.desc}</p>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {item.action} <ChevronRight size={10} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest leading-relaxed">
            In case of life-threatening emergencies, always dial 112 immediately. <br />
            This platform provides information and guidance but does not replace professional emergency services.
          </p>
        </div>

      </div>
    </div>
  );
}
