import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudHail,
  SunMedium,
  MoonStar,
  Wind,
  Droplets,
  Eye,
  Compass,
  Gauge,
  Thermometer,
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  name,
  className = 'w-6 h-6',
  size,
  color,
}) => {
  const props = { className, size, color };

  switch (name) {
    case 'Sun':
      return <Sun {...props} />;
    case 'Moon':
      return <Moon {...props} />;
    case 'SunMedium':
      return <SunMedium {...props} />;
    case 'MoonStar':
      return <MoonStar {...props} />;
    case 'CloudSun':
      return <CloudSun {...props} />;
    case 'CloudMoon':
      return <CloudMoon {...props} />;
    case 'CloudRain':
      return <CloudRain {...props} />;
    case 'CloudDrizzle':
      return <CloudDrizzle {...props} />;
    case 'CloudSnow':
      return <CloudSnow {...props} />;
    case 'CloudLightning':
      return <CloudLightning {...props} />;
    case 'CloudFog':
      return <CloudFog {...props} />;
    case 'CloudHail':
      return <CloudHail {...props} />;
    case 'Wind':
      return <Wind {...props} />;
    case 'Droplets':
      return <Droplets {...props} />;
    case 'Eye':
      return <Eye {...props} />;
    case 'Compass':
      return <Compass {...props} />;
    case 'Gauge':
      return <Gauge {...props} />;
    case 'Thermometer':
      return <Thermometer {...props} />;
    default:
      return <Cloud {...props} />;
  }
};
