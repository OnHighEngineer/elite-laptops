export type Condition = "new" | "refurbished" | "open-box";
export type StockStatus = "in_stock" | "out_of_stock" | "coming_soon";

export interface SpecDetails {
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  screen: string;
  os: string;
  battery: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  /** All photos, cover first. Falls back to [image] when absent. */
  images?: string[];
  price: number;
  originalPrice?: number;
  specs: string[];
  condition: Condition;
  inStock: boolean;
  category?: string;
  stockStatus?: StockStatus;
  warrantyMonths?: number;
  serviceMonths?: number;
  warrantyNote?: string;
  specDetails?: SpecDetails;
  extraSpecs?: string[];
  /** Units available. When set, orders above this are rejected. */
  stock?: number;
  featured?: boolean;
  description: string;
}

export const laptops: Product[] = [
  {
    "id": "hp-pavilion-15",
    "name": "HP Pavilion 15",
    "brand": "HP",
    "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop",
    "price": 38999,
    "originalPrice": 45000,
    "specs": [
      "Intel Core i5-12th Gen",
      "8GB RAM",
      "512GB SSD",
      "15.6\" FHD"
    ],
    "condition": "new",
    "inStock": true,
    "featured": true,
    "description": "Sleek everyday laptop ideal for students and professionals."
  },
  {
    "id": "hp-elitebook-840",
    "name": "HP EliteBook 840 G8",
    "brand": "HP",
    "image": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop",
    "price": 54999,
    "originalPrice": 72000,
    "specs": [
      "Intel Core i7-11th Gen",
      "16GB RAM",
      "512GB SSD",
      "14\" FHD"
    ],
    "condition": "refurbished",
    "inStock": true,
    "featured": true,
    "description": "Business-grade laptop with enterprise security features."
  },
  {
    "id": "dell-inspiron-15",
    "name": "Dell Inspiron 15 3511",
    "brand": "Dell",
    "image": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop",
    "price": 34999,
    "originalPrice": 42000,
    "specs": [
      "Intel Core i5-11th Gen",
      "8GB RAM",
      "256GB SSD",
      "15.6\" FHD"
    ],
    "condition": "refurbished",
    "inStock": true,
    "featured": true,
    "description": "Reliable everyday laptop for work and entertainment."
  },
  {
    "id": "dell-latitude-5420",
    "name": "Dell Latitude 5420",
    "brand": "Dell",
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop",
    "price": 48500,
    "originalPrice": 65000,
    "specs": [
      "Intel Core i7-11th Gen",
      "16GB RAM",
      "512GB SSD",
      "14\" FHD"
    ],
    "condition": "refurbished",
    "inStock": true,
    "featured": true,
    "description": "Premium business laptop with military-grade durability."
  },
  {
    "id": "lenovo-thinkpad-e15",
    "name": "Lenovo ThinkPad E15",
    "brand": "Lenovo",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop",
    "price": 42999,
    "originalPrice": 55000,
    "specs": [
      "AMD Ryzen 5 5500U",
      "8GB RAM",
      "512GB SSD",
      "15.6\" FHD"
    ],
    "condition": "new",
    "inStock": true,
    "featured": true,
    "description": "Legendary ThinkPad reliability with modern AMD performance."
  },
  {
    "id": "lenovo-ideapad-5",
    "name": "Lenovo IdeaPad 5",
    "brand": "Lenovo",
    "image": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop",
    "price": 36499,
    "originalPrice": 44000,
    "specs": [
      "AMD Ryzen 7 5700U",
      "16GB RAM",
      "512GB SSD",
      "14\" FHD"
    ],
    "condition": "new",
    "inStock": true,
    "featured": true,
    "description": "Powerful mid-range laptop with stunning display."
  },
  {
    "id": "asus-vivobook-15",
    "name": "Asus VivoBook 15",
    "brand": "Asus",
    "image": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop",
    "price": 32999,
    "originalPrice": 40000,
    "specs": [
      "Intel Core i5-12th Gen",
      "8GB RAM",
      "512GB SSD",
      "15.6\" FHD"
    ],
    "condition": "new",
    "inStock": true,
    "featured": false,
    "description": "Slim, lightweight laptop with all-day battery life."
  },
  {
    "id": "asus-zenbook-14",
    "name": "Asus ZenBook 14",
    "brand": "Asus",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop",
    "price": 59999,
    "originalPrice": 74000,
    "specs": [
      "Intel Core i7-12th Gen",
      "16GB RAM",
      "1TB SSD",
      "14\" 2.8K OLED"
    ],
    "condition": "new",
    "inStock": true,
    "featured": false,
    "description": "Ultra-premium ultrabook with OLED display."
  },
  {
    "id": "dell-xps-13",
    "name": "Dell XPS 13 9310",
    "brand": "Dell",
    "image": "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop",
    "price": 74999,
    "originalPrice": 95000,
    "specs": [
      "Intel Core i7-11th Gen",
      "16GB RAM",
      "512GB SSD",
      "13.4\" FHD+"
    ],
    "condition": "refurbished",
    "inStock": false,
    "featured": false,
    "description": "Dell flagship ultrabook — compact, powerful, premium."
  },
  {
    "id": "asus-tuf-a15",
    "name": "Asus TUF Gaming A15",
    "brand": "Asus",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop",
    "price": 62999,
    "originalPrice": 78000,
    "specs": [
      "AMD Ryzen 9 5900HX",
      "16GB RAM",
      "512GB SSD",
      "15.6\" 144Hz"
    ],
    "condition": "new",
    "inStock": true,
    "featured": false,
    "description": "Military-grade gaming laptop with high-refresh display."
  }
];

export const BRANDS = ["HP", "Dell", "Lenovo", "Asus"] as const;
