import { useState } from "react";
import { ProductAnalyticsDemo } from "@/components/products/tabs/ProductAnalyticsDemo";

export const ProductCreationDemo = () => {
  const [formData, setFormData] = useState({
    track_views: true,
    track_clicks: true,
    track_purchases: false,
    track_time_spent: true,
    google_analytics_id: "GA-XXXXXXXXX",
    facebook_pixel_id: "123456789012345",
    google_tag_manager_id: "GTM-XXXXXXX",
    advanced_tracking: false,
    target_views: 1000,
    target_conversions: 50,
    target_revenue: 5000,
    target_conversion_rate: 5.0,
    email_alerts: false
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ProductAnalyticsDemo 
      formData={formData} 
      updateFormData={updateFormData} 
    />
  );
};

export default ProductCreationDemo;
