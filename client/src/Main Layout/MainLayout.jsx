import { BrowserRouter, Route, Routes } from "react-router"
import Home from "../Pages/Home/Home"
import Footer from "../Components/Footer"
import FindProperty from "../Pages/Find Property/FindProperty"
import CompareHomes from "../Pages/Compare Homes/CompareHomes"
import Header from "../Components/Header"
import Saved from "../Pages/Saved/Saved"
import PropertyDetail from "../Pages/PropertyDetail/PropertyDetail"

const MainLayout = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find-property" element={<FindProperty />} />
        <Route path="/compare-homes" element={<CompareHomes />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default MainLayout
