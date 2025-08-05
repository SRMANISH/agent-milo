import { Facebook, Twitter, Youtube } from "lucide-react";
import React from "react";

const Footer = () => {
  return (
    <footer className="footer footer-horizontal shadow-lg shadow-neutral-800 footer-center bg-white text-neutral-800 p-10">
      <div className="flex flex-col items-center gap-4">
        <aside className="text-center">
          <p className="font-bold pb-2">AgentMira Pvt Ltd.</p>
          <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
        </aside>
        <nav>
          <div className="flex gap-4">
            <a href="#"><Twitter /></a>
            <a href="#"><Youtube /></a>
            <a href="#"><Facebook /></a>
          </div>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
