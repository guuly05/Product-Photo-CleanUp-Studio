import { SampleProduct } from '../types';

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'sneaker-1',
    name: 'Pro Leather Sneaker',
    category: 'Footwear & Fashion',
    description: 'Streetwear sneaker shot on outdoor concrete with background distractions.',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Remove background and place on seamless pure studio white (#FFFFFF) with realistic ground contact shadow.',
      'Place sneaker on a sleek dark granite podium with dramatic edge lighting.',
      'Remove background and place product on light gray e-commerce backdrop for Amazon.'
    ]
  },
  {
    id: 'cosmetic-1',
    name: 'Hydrating Face Serum',
    category: 'Beauty & Cosmetics',
    description: 'Skincare dropper bottle with harsh studio reflections and glare.',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Clean up glass bottle reflections, dust, and fingerprint blemishes on the surface.',
      'Remove background and set bottle on a luxury white marble slab with soft water ripples in backdrop.',
      'Isolate cosmetic bottle on transparent background with crisp edges.'
    ]
  },
  {
    id: 'headphones-1',
    name: 'Studio Wireless Headphones',
    category: 'Consumer Tech',
    description: 'Over-ear headphones placed on a cluttered wooden office desk.',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Remove cluttered desk background and isolate headphones on pure white studio background (#FFFFFF).',
      'Place headphones on a minimalist dark matte pedestal with soft ambient glow.',
      'Clean up dust on earcups and enhance metallic texture accents.'
    ]
  },
  {
    id: 'sunglasses-1',
    name: 'Aviator Sunglasses',
    category: 'Accessories',
    description: 'Designer sunglasses with background glare and reflections.',
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Remove background and place on a warm sand gradient studio backdrop.',
      'Clean lens reflections and scratches, make frame metallic sheen pristine.',
      'Isolate glasses on transparent background centered with 15% padding.'
    ]
  },
  {
    id: 'watch-1',
    name: 'Chronograph Leather Watch',
    category: 'Luxury Goods',
    description: 'Watch on textured cloth with uneven shadows.',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Remove cloth background and place watch on dark charcoal studio backdrop.',
      'Clean up bezel glare and dust on watch glass crystal.',
      'Shopify Spec: Center watch on seamless off-white background with soft drop shadow.'
    ]
  },
  {
    id: 'mug-1',
    name: 'Ceramic Espresso Mug',
    category: 'Home & Kitchen',
    description: 'Handcrafted ceramic mug with messy kitchen background.',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
    suggestedPrompts: [
      'Remove kitchen background and place mug on a warm Scandinavian oak wooden table.',
      'Clean up surface blemishes and enhance glaze sheen.',
      'Place mug on clean pastel sage green background.'
    ]
  }
];
