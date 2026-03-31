import {
  X,
  Eye,
  ShoppingCart,
  TrendingUp,
  Star,
  Package,
  DollarSign,
} from "lucide-react";
import React from "react";

interface AnalyticsModalProps {
  product: any;
  onClose: () => void;
  analyticsData?: any;
}

const AnalyticsModal = ({
  product,
  onClose,
  analyticsData,
}: AnalyticsModalProps) => {
  // Mock analytics data - replace with actual API data when available
  const stats = analyticsData || {
    totalViews: Math.floor(Math.random() * 5000) + 100,
    totalSales: Math.floor(Math.random() * 100) + 10,
    revenue: (
      product.salePrice *
      (Math.floor(Math.random() * 100) + 10)
    ).toFixed(2),
    conversionRate: (Math.random() * 5 + 1).toFixed(2),
    averageRating: product.ratings || 5,
    stockStatus: product.stock,
    lastUpdated: new Date(product.updatedAt).toLocaleDateString(),
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg md:w-[600px] max-h-[90vh] overflow-y-auto shadow-lg text-white">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
          <h3 className="text-xl font-semibold">Product Analytics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-6 pb-4 border-b border-gray-700">
          <h4 className="text-lg font-medium text-white mb-1">
            {product.title}
          </h4>
          <p className="text-sm text-gray-400">
            Category: {product.category} / {product.subCategory}
          </p>
          <p className="text-sm text-gray-400">
            Last Updated: {stats.lastUpdated}
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Views */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="text-blue-400" size={24} />
              <h5 className="text-gray-300 text-sm font-medium">Total Views</h5>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>

          {/* Total Sales */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="text-green-400" size={24} />
              <h5 className="text-gray-300 text-sm font-medium">Total Sales</h5>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.totalSales.toLocaleString()}
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-yellow-400" size={24} />
              <h5 className="text-gray-300 text-sm font-medium">Revenue</h5>
            </div>
            <p className="text-2xl font-bold text-white">₹{stats.revenue}</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-purple-400" size={24} />
              <h5 className="text-gray-300 text-sm font-medium">
                Conversion Rate
              </h5>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.conversionRate}%
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-yellow-400" fill="#facc15" size={24} />
              <h5 className="text-gray-300 text-sm font-medium">
                Average Rating
              </h5>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.averageRating.toFixed(1)} / 5
            </p>
          </div>

          {/* Stock Status */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Package
                className={
                  stats.stockStatus < 10 ? "text-red-400" : "text-cyan-400"
                }
                size={24}
              />
              <h5 className="text-gray-300 text-sm font-medium">
                Stock Status
              </h5>
            </div>
            <p
              className={`text-2xl font-bold ${stats.stockStatus < 10 ? "text-red-400" : "text-white"}`}
            >
              {stats.stockStatus} units
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h5 className="text-sm font-semibold text-gray-300 mb-3">
            Product Performance
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Regular Price:</span>
              <span className="text-white font-medium">
                ₹{product.regularPrice}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sale Price:</span>
              <span className="text-green-400 font-medium">
                ₹{product.salePrice}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Discount:</span>
              <span className="text-yellow-400 font-medium">
                {(
                  ((product.regularPrice - product.salePrice) /
                    product.regularPrice) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={`font-medium ${
                  product.status === "Active"
                    ? "text-green-400"
                    : product.status === "Draft"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }`}
              >
                {product.status}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-md text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
