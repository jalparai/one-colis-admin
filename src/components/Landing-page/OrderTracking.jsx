"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import Img from "../../../public/Shipping-track.jpg";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);

  const handleTrackOrder = () => {
    // For now, simulate tracking (replace with API call later)
    if (orderNumber === "12345") {
      setOrderDetails({
        orderId: "12345",
        status: "In Transit",
        estimatedDelivery: "Sep 10, 2025",
        location: "Casablanca, Morocco",
      });
    } else {
      setOrderDetails({
        error: "Order not found. Please check your number.",
      });
    }
  };

  return (
    <section
      id="tracking"
      className="relative py-20 px-6 overflow-hidden"
    >
      {/* Background Image */}
      <Image
        src={Img}
        alt="Order Tracking"
        fill
        className="object-cover"
        priority
      />

      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20 container mx-auto lg:w-[90%] w-full text-left">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Track Your Order
        </h2>
        <p className="text-gray-200 mb-8">
          Enter your order number below to see the latest status.
        </p>

        <div className="w-full gap-20 flex justify-between items-center">
          <div className="lg:w-[50%] w-[95%]">
            {/* Input + Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter your order number"
                className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-800 w-full"
              />
              <button
                onClick={handleTrackOrder}
                className="flex items-center justify-center bg-[#111b3d] text-white px-6 py-3 rounded-lg font-medium transition w-full sm:w-auto"
              >
                <Search className="w-5 h-5 mr-2" /> Track Order
              </button>
            </div>

            {/* Order Details */}
            {orderDetails && (
              <div className="mt-6 p-6 bg-white/90 border border-gray-200 rounded-lg text-left shadow-sm">
                {orderDetails.error ? (
                  <p className="text-red-600 font-medium">
                    {orderDetails.error}
                  </p>
                ) : (
                  <>
                    <p className="text-gray-700">
                      <span className="font-semibold">Order ID:</span>{" "}
                      {orderDetails.orderId}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Status:</span>{" "}
                      {orderDetails.status}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Estimated Delivery:</span>{" "}
                      {orderDetails.estimatedDelivery}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Current Location:</span>{" "}
                      {orderDetails.location}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
