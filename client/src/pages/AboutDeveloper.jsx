import React from 'react';
// Import official icons from react-icons
import { FaLinkedin, FaGithub, FaYoutube, FaInstagram, FaTwitter } from 'react-icons/fa';
// Import your local image
import AMIT_IMAGE from '../assets/AMIT_IMAGE.jpg';
import Amit from '../assets/Amit.png';


const AboutDeveloper = () => {
  const socialLinks = [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/amit-kiran-kar-975744277", icon: <FaLinkedin />, color: "hover:text-[#0077b5]" },
    { name: "GitHub", url: "https://github.com/AmitKK10", icon: <FaGithub />, color: "hover:text-[#f0f6fc]" },
    { name: "YouTube", url: "https://youtube.com/@amitkk-jz3ji", icon: <FaYoutube />, color: "hover:text-[#ff0000]" },
    { name: "Instagram", url: "https://www.instagram.com/amit_kiran_kar_10/", icon: <FaInstagram />, color: "hover:text-[#e4405f]" },
    { name: "X (Twitter)", url: "https://x.com/AmitKK1007", icon: <FaTwitter />, color: "hover:text-[#1da1f2]" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto pt-10">
        
        {/* HERO SECTION */}
        <section className="text-center mb-16">
          <div className="relative inline-block mb-6">
            {/* PROFILE PICTURE BOX */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-1.5 shadow-2xl">
              <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                <img 
                  src={Amit} 
                  alt="Amit Kiran Kar" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 border-8 border-slate-950 rounded-full"></div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-2">Amit Kiran Kar</h1>
          <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs">Full-Stack Engineer & Founder</p>
        </section>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* LEFT COL: BIO */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                The Visionary Behind Offer Bridge
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                I am a passionate MERN stack developer dedicated to building "Revolutionary Financial Intermediaries." 
                I built <strong>Offer Bridge</strong> from the ground up—handling everything from System Architecture 
                and Database Design to the Real-time Socket logic and Frontend UX. 
              </p>
              <p className="text-slate-400 leading-relaxed">
                My goal is to solve real-world financial gaps. By connecting those with credit capacity 
                to those with purchasing needs, I believe we can democratize the digital economy.
              </p>
            </div>

            {/* STATS AREA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {[
                 { label: "Lines of Code", val: "10k+" },
                 { label: "Logic Security", val: "100%" },
                 { label: "Innovation", val: "Unique" }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center hover:bg-white/10 transition-all">
                    <p className="text-2xl font-black text-white">{stat.val}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{stat.label}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* RIGHT COL: CONTACT & SOCIALS */}
          <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-blue-400">Direct Contact</h3>
              <div className="space-y-4">
                <a href="tel:9563574862" className="flex items-center gap-3 group">
                  <span className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500 transition-all">📞</span>
                  <span className="text-sm font-medium">9563574862</span>
                </a>
                <a href="mailto:amitkiran1007@gmail.com" className="flex items-center gap-3 group">
                  <span className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500 transition-all">📧</span>
                  <span className="text-sm font-medium truncate">amitkiran1007@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-500">Digital Footprint</h3>
              <div className="flex flex-col gap-4">
                {socialLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={`flex items-center gap-4 text-sm font-bold text-slate-400 transition-all ${link.color} group`}
                  >
                    <span className="text-xl p-2 bg-white/5 rounded-xl group-hover:bg-current group-hover:text-slate-900 transition-all">
                      {link.icon}
                    </span>
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER CALL TO ACTION */}
        <div className="mt-20 text-center">
            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.4em] mb-4">Available for Innovation & Collaboration</p>
            <button 
              onClick={() => window.location.href = "mailto:amitkiran1007@gmail.com"}
              className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-xl"
            >
              LET'S BUILD SOMETHING BIG
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;