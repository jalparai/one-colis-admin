import {
  Truck,
  Package,
  MapPin,
  BarChart3,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  Warehouse,
  CreditCard,
  Eye,
  Bell,
  Route,
  UserCheck,
  PackageCheck,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  Building2,
    Facebook, Twitter, Linkedin
} from "lucide-react"
import Image from "next/image"
import Shiping from "../../public/Shipping.png"
import Header from "../components/Landing-page/Header"
import OrderTracking from "../components/Landing-page/OrderTracking"
import FooterLogo from "../../public/images/One-Colis.png"
import AboutUsImage from "../../public/about-us.jpeg"
import CityTable from "../components/Landing-page/Pricing"
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

<Header />
      {/* Hero Section */}
      <section className="py-20 px-4 relative bgImg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/50"></div>
       <div className="relative z-10 container mx-auto text-center lg:px-6 max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#dbb160]/20 text-[#dbb160] text-sm font-medium mb-6">
          🇲🇦 Morocco's Leading COD Platform
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
          Complete Cash on Delivery Platform for {" "}
          <span className="text-[#dbb160]">Moroccan E-commerce</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          From order creation to cash collection – manage your entire shipping workflow with real warehouses, trained delivery agents, and automated systems built specifically for Morocco.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-[#111b3d] text-white px-8 py-3 rounded-md font-semibold shadow-md transition-all flex items-center justify-center group">
            Start Shipping Today
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      </section>


{/* Partnership / About Us Section */}
<section id="about" className="relative py-20 px-6 bg-white text-gray-800">
  <div className="container mx-auto max-w-7xl grid md:grid-cols-2 gap-12 items-center">
    
    {/* Left - Image */}
    <div className="relative rounded-2xl overflow-hidden shadow-lg group">
      <Image 
        src={AboutUsImage}
        alt="Shipping Partnership" 
        className="rounded-2xl w-full h-[420px] object-cover transform group-hover:scale-105 transition duration-700"
      />
      <div className="absolute inset-0 bg-black/30"></div>
      <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white drop-shadow-lg">
        Delivering Success Together 🚚
      </h3>
    </div>

    {/* Right - Text */}
    <div>
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#111b3d]">
        Partner with <span className="text-yellow-500">OneColis</span>
      </h2>
      <p className="text-lg text-gray-600 mb-6 leading-relaxed">
        At <span className="font-semibold text-gray-800">OneColis</span>, we go beyond logistics.  
        We create partnerships that empower Moroccan e-commerce sellers to scale 
        with confidence. From reliable Cash on Delivery to advanced tracking, 
        we ensure your business is always moving forward.
      </p>
      <p className="text-gray-500 mb-8">
        Let’s simplify shipping, unlock growth, and build the future of Moroccan logistics — together.
      </p>
      <a
        href="#contact"
        className="inline-block bg-[#111b3d] text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-[#0e1530] transition"
      >
        Become a Partner
      </a>
    </div>
  </div>
</section>



      {/* Shipping Process Section */}
<section
  id="process"
  className="py-16 px-4 bg-gradient-to-r from-[#111b3d] via-slate-800 to-[#111b3d] border-t border-slate-700 relative"
>
  <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
  <div className="container mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Complete Shipping Process
      </h2>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        From order creation to cash in hand – see how OneColis handles every step of your shipping journey
      </p>
    </div>

    {/* Desktop Circle Diagram */}
    <div className="hidden md:block relative w-full max-w-4xl mx-auto mb-16">
      <div className="relative w-[500px] h-[500px] mx-auto">
        {/* Center Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-40 h-40 bg-[#131e3d] border-2 border-white mt-[31px] rounded-full flex items-center justify-center shadow-2xl">
            <Image src={Shiping} alt="Shipping" className="w-100" />
          </div>
        </div>

        {/* Circular Steps */}
        {[
          { icon: UserCheck, title: "Happy Customers", angle: 0, color: "bg-green-500" },
          { icon: PackageCheck, title: "You Create Shipment", angle: 45, color: "bg-blue-500" },
          { icon: Truck, title: "We Pick Up", angle: 90, color: "bg-purple-500" },
          { icon: Route, title: "Smart Routing", angle: 135, color: "bg-indigo-500" },
          { icon: Eye, title: "Live Tracking", angle: 180, color: "bg-cyan-500" },
          { icon: CreditCard, title: "COD Collection", angle: 225, color: "bg-yellow-500" },
          { icon: Bell, title: "Instant Notification", angle: 270, color: "bg-orange-500" },
          { icon: DollarSign, title: "Next-Day Payout", angle: 315, color: "bg-red-500" },
        ].map((step, index) => {
          const radius = 200;
          const angleRad = (step.angle * Math.PI) / 180;
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;

          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <div
                className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 border-2 border-white/20`}
              >
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-28 text-center">
                <p className="text-white font-medium text-sm leading-tight">
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Mobile Vertical Steps */}
    <div className="block md:hidden space-y-6">
      {[
        { icon: UserCheck, title: "Happy Customers", color: "bg-green-500" },
        { icon: PackageCheck, title: "You Create Shipment", color: "bg-blue-500" },
        { icon: Truck, title: "We Pick Up", color: "bg-purple-500" },
        { icon: Route, title: "Smart Routing", color: "bg-indigo-500" },
        { icon: Eye, title: "Live Tracking", color: "bg-cyan-500" },
        { icon: CreditCard, title: "COD Collection", color: "bg-yellow-500" },
        { icon: Bell, title: "Instant Notification", color: "bg-orange-500" },
        { icon: DollarSign, title: "Next-Day Payout", color: "bg-red-500" },
      ].map((step, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className={`w-14 h-14 ${step.color} rounded-full flex items-center justify-center`}>
            <step.icon className="w-7 h-7 text-white" />
          </div>
          <p className="text-white font-medium text-base">{step.title}</p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Infrastructure Section */}
    {/* Infrastructure Section */}
<section
  id="infrastructure"
  className="py-24 px-4 relative overflow-hidden bg-white"
>
  {/* Decorative background shapes removed */}

  <div className="container mx-auto relative z-10 lg:w-[90%] w-[95%]">
    {/* Title */}
    <div className="text-center mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
        Real Infrastructure, <span className="text-gray-800">Real Results</span>
      </h2>
      <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
        Physical warehouses, trained delivery agents, and modern vehicles across Morocco.
      </p>
    </div>

    {/* Showcase Cards */}
    <div className="grid md:grid-cols-3 gap-10 mb-20">
      {[
        {
          title: "Strategic Warehouses",
          desc: "Climate-controlled facilities across Morocco",
          img: "/images/warehouse.jpg",
        },
        {
          title: "Modern Fleet",
          desc: "GPS-tracked vehicles for reliable delivery",
          img: "/city-table.jpeg",
        },
        {
          title: "Trained Professionals",
          desc: "Certified agents for secure COD collection",
          img: "/images/delivery-agent.jpg",
        },
      ].map((item, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl shadow-lg group"
        >
          <img
            src={item.img}
            alt={item.title}
            className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:via-black/50 transition-all"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
            <p className="text-sm opacity-90">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Feature Cards */}
    <div className="grid md:grid-cols-3 gap-10">
      {/* Warehouse */}
      <div className="group bg-white hover:bg-gray-50 transition-all duration-300 rounded-xl p-8 border border-gray-200 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Warehouse className="h-8 w-8 text-gray-800" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Modern Warehouses</h3>
          <p className="text-gray-600 mb-6">
            Strategic locations across major Moroccan cities with advanced inventory systems.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Casablanca, Rabat, Marrakech
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Climate-controlled storage
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> 24/7 security monitoring
            </li>
          </ul>
        </div>
      </div>

      {/* Fleet */}
      <div className="group bg-white hover:bg-gray-50 transition-all duration-300 rounded-xl p-8 border border-gray-200 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Truck className="h-8 w-8 text-gray-800" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Delivery Fleet</h3>
          <p className="text-gray-600 mb-6">
            Modern vehicles equipped with GPS tracking and eco-friendly options.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> 500+ delivery vehicles
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Real-time GPS tracking
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Temperature control units
            </li>
          </ul>
        </div>
      </div>

      {/* Agents */}
      <div className="group bg-white hover:bg-gray-50 transition-all duration-300 rounded-xl p-8 border border-gray-200 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Users className="h-8 w-8 text-gray-800" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Trained Agents</h3>
          <p className="text-gray-600 mb-6">
            Professional delivery agents trained in customer service & cash handling.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> 1000+ certified agents
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Multi-language support
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Background verified
            </li>
          </ul>
        </div>
      </div>
    </div>

   
  </div>
</section>




      {/* Dashboard Preview Section */}
      <section className="py-24 px-4 relative overflow-hidden">
    
      <div className="lg:w-[90%] w-[95%] m-auto">

          <div className="absolute inset-0 bg-[#111b3d]"></div>
               
        {/* <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fillOpacity='0.1' fillRule='evenodd'/%3E%3C/svg%3E")`,
          }}
        ></div> */}

        <div  className="container mx-auto relative z-10">
          <div className="lg:flex w-full justify-end  relative bottom-[102px]">
             <main className="relative  overflow-hidden">

  <div className="absolute top-[-117px] inset-0 z-0 pointer-events-none">
    <svg viewBox="0 0 1024 768" fill="none" className="w-full h-full opacity-30">
      <path
        d="M150 200 C400 300, 600 100, 900 300"
        stroke="#00C0FF"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5 5"
      />
    </svg>
  </div>


  <div className="relative z-10  pt-24 px-4 lg:text-left text-center" id="pricing">
    <h1 className="text-4xl text-white md:text-5xl font-bold mb-6 leading-tight drop-shadow-md">
      Shipping throughout Morocco
    </h1>
    <p className="text-lg text-white mb-10 opacity-80 lg:text-left text-center">
      Fast, reliable, and affordable delivery to every major city.
    </p>



  </div>
</main> 
             <CityTable />
          </div>
          
          <div className="text-center mb-16" id="dashboard" >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Dashboard & Analytics</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Real-time insights and complete control over your shipping operations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Management Dashboard */}
            <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-lg">
              <div className="pb-4">
                <h3 className="flex items-center space-x-2 text-white text-xl font-bold">
                  <BarChart3 className="h-5 w-5 text-blue-300" />
                  <span>Order Management</span>
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white">1,247</div>
                    <div className="text-sm text-blue-200">Active Orders</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-green-400">89%</div>
                    <div className="text-sm text-blue-200">Delivery Rate</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">Pending Pickup</span>
                    <span className="text-sm font-medium text-white">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">In Transit</span>
                    <span className="text-sm font-medium text-white">423</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">Delivered</span>
                    <span className="text-sm font-medium text-white">668</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Dashboard */}
            <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-lg">
              <div className="pb-4">
                <h3 className="flex items-center space-x-2 text-white text-xl font-bold">
                  <CreditCard className="h-5 w-5 text-blue-300" />
                  <span>Financial Overview</span>
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white">47,250 MAD</div>
                    <div className="text-sm text-blue-200">COD Collected</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-blue-300">12,340 MAD</div>
                    <div className="text-sm text-blue-200">Pending Payout</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">Today's Collection</span>
                    <span className="text-sm font-medium text-green-400">+2,450 MAD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">Commission Rate</span>
                    <span className="text-sm font-medium text-white">8.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">Next Payout</span>
                    <span className="text-sm font-medium text-white">Tomorrow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">Real-time Tracking</h4>
              <p className="text-sm text-blue-200">Live GPS tracking for all shipments with customer notifications</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">Advanced Analytics</h4>
              <p className="text-sm text-blue-200">
                Detailed reports on performance, revenue, and customer satisfaction
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">Secure Payments</h4>
              <p className="text-sm text-blue-200">
                Automated COD collection with next-day payouts and full transparency
              </p>
            </div>
          </div>
        </div>
      </div>
      </section>
<OrderTracking  />

    

    {/* Contact Section */}
{/* Contact Section */}
<section id="contact" className="relative">
  {/* Full-width Google Map */}
  <div className="w-full h-[450px]">
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3313.0698766409105!2d-5.5670024!3d33.86209!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda05be9d3327959%3A0xa13ce6535da819cf!2sOneColis!5e0!3m2!1sen!2s!4v1756999806488!5m2!1sen!2s"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>

 
  <div className="container mx-auto px-4">
    <div className="grid md:grid-cols-2 gap-8 bg-white shadow-lg  rounded-sm p-2 md:p-2 absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl top-[638px]">
      
      {/* Contact Form */}
      <div className="lg:p-[20px] p-[10px]">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Drop us a Line</h3>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows="4"
            placeholder="Message"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <button
            type="submit"
            className="bg-[#111b3d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0e1530] transition"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Contact Info */}
      <div className="bg-[#111b3d] text-white rounded-md p-8">
        <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
        <p className="mb-4">Feel free to reach out to us for any inquiries.</p>
        <ul className="space-y-4">
          <li className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-white" />
            <span>+212 5XX-XXXXXX</span>
          </li>
          <li className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-white" />
            <span>contact@onecolis.ma</span>
          </li>
          <li className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-white" />
            <span>Casablanca, Morocco</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>



      {/* Footer */}
  <footer className="bg-slate-900 border-t border-slate-700 py-10 lg:pt-[478px] pt-[596px]">
<div className="container mx-auto px-6 text-center space-y-6">
{/* Logo */}
<div className="flex justify-center items-center space-x-2">
<Image src={FooterLogo} alt="" className="w-50"/>
</div>


{/* Links */}
<div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
<a href="#process" className="hover:text-white transition-colors">Process</a>
<a href="#infrastructure" className="hover:text-white transition-colors">Infrastructure</a>
<a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a>
<a href="#tracking" className="hover:text-white transition-colors">Track Order</a>
<a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
<a  href="#contact" className="hover:text-white transition-colors">Contact</a>
</div>


{/* Social Icons */}
<div className="flex justify-center space-x-6 text-gray-400">
<a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
<a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
<a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
</div>


{/* Copyright */}
<p className="text-xs text-gray-500">© 2024 OneColis. All rights reserved.</p>
</div>
</footer>
    </div>
  )
}
