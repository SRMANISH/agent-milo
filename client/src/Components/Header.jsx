import { Bookmark, Menu, X } from "lucide-react";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { motion as Motion } from "framer-motion";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  return (
    <header className="relative w-full z-50 transition-all duration-300">
      <div className="container mt-3 mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        {}
        <Link to="/" element="../Pages/Home/Home.jsx">
          <div className="flex items-center py-4 gap-0.5">
            <div className="pt-1 text-2xl font-logo">Agent</div>
            <div className="text-4xl font-medium font-logo text-blue-700">
              Mira
            </div>
          </div>
        </Link>

        <div className="lg:flex hidden space-x-12 font-medium">
          {[
            { name: "Home", path: "/" },
            { name: "Find Properties", path: "/find-property" },
          ].map(({ name, path }) => (
            <NavLink
              key={name}
              to={path}
              className="relative transition-colors duration-300 group hover:text-blue-700"
            >
              {name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 group-hover:w-full transition-all duration-300"></span>
            </NavLink>
          ))}
        </div>

        <div className="md:flex hidden items-center space-x-4">
          <NavLink to="/saved">
            <button className="btn btn-outline bg-transparent border-neutral-200 hover:bg-blue-700 hover:text-white shadow-md transition-all hover:scale-115 duration-300">
              <Bookmark /> Saved
            </button>
          </NavLink>
        </div>

        <div className="md:hidden flex items-center">
          <Motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleMenu}
            className="text-black p-2 rounded-md hover:bg-blue-700 hover:text-white transition-colors duration-300"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Motion.button>
        </div>
      </div>

      <Motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? "auto" : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-blue-700 shadow-lg px-4 py-5 space-y-5"
      >
        <nav className="flex flex-col space-y-3">
          {[
            { name: "Home", path: "/" },
            { name: "Find Properties", path: "/find-property" },
          ].map(({ name, path }) => (
            <NavLink
              onClick={toggleMenu}
              key={name}
              to={path}
              className="text-white font-medium py-2 hover:text-neutral-300"
            >
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="pt-2 border-t border-blue-600">
          <div className="flex"></div>
        </div>

        <div className="">
          <NavLink to="/saved">
            <button className="btn btn-ghost border-none bg-white hover:bg-neutral-300 hover:font-extrabold transition-colors duration-300">
              <Bookmark /> Saved
            </button>
          </NavLink>
        </div>

      </Motion.div>
    </header>
  );
};

export default Header;
