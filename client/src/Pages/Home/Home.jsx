import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bot, Heart, House } from "lucide-react";
import HeroImage from "../../assets/HeroImage.png";

const Home = () => {
  return (
    <section className="min-h-screen page-body flex md:flex-row flex-col items-center justify-between lg:px-24 px-10 relative overflow-hidden">
      {/* left part */}

      <div className="w-full md:w-1/2 space-y-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
          Your Home Journey Starts with{" "}
          <span className="text-blue-700 flex items-center gap-2 ">
            Intelligence <Bot className="size-15" />
          </span>
        </h1>
        <p className="text-2xl flex">
          Your next chapter starts here. Search smarter, compare
          effortlessly,and discover homes you’ll love 💙.
        </p>
        <Link to="/find-property">
          <button className="btn btn-soft text-blue-700 bg-white border-none shadow-md shadow-blue-200 font-bold hover:bg-blue-700 hover:text-white hover:shadow-md transition-all duration-300 transform hover:scale-107 ">
            Find Properties <ArrowUpRight />
          </button>
        </Link>
      </div>

      {/* right part */}
      <div className="w-full md:w-1/2 md:mt-0 pl-0 md:pl-12 ">
        <div className="relative">
          <img
            src={HeroImage}
            alt="hero_image"
            className="w-full max-w-md md:max-w-lg lg:max-w-xl h-auto relative z-10 hover:scale-[1.02] transition-transform duration-300"
          ></img>
        </div>
      </div>
    </section>
  );
};

export default Home;
