import { PresetInstruction } from '../types';

export const PRESET_INSTRUCTIONS: PresetInstruction[] = [
  // Background Removal & Backdrops
  {
    id: 'bg-white',
    title: 'Studio Pure White',
    icon: 'Maximize2',
    description: '100% white (#FFFFFF) background for e-commerce listings',
    prompt: 'Remove background completely and replace with a pure seamless studio white (#FFFFFF) background. Add a soft natural contact shadow under the product so it rests realistically on the ground.',
    category: 'background'
  },
  {
    id: 'bg-transparent',
    title: 'Isolate & Transparent',
    icon: 'Crop',
    description: 'Clean product cutout ready for compositing',
    prompt: 'Isolate the product object cleanly. Remove all background elements, reflections, and context, providing a sharp high-contrast cutout on a clean neutral background.',
    category: 'background'
  },
  {
    id: 'bg-wood',
    title: 'Oak Wood Table',
    icon: 'Layers',
    description: 'Warm natural wood tabletop display',
    prompt: 'Remove original background and place the product on a premium rustic oak wooden tabletop with soft natural window sunlight coming from the side.',
    category: 'background'
  },
  {
    id: 'bg-marble',
    title: 'Marble Pedestal',
    icon: 'Box',
    description: 'Luxurious white marble display stand',
    prompt: 'Place the product cleanly onto a sleek white Carrara marble pedestal with soft subtle background blur and elegant ambient reflection.',
    category: 'background'
  },
  {
    id: 'bg-gray-gradient',
    title: 'Neutral Light Gray',
    icon: 'Sun',
    description: 'Minimalist studio backdrop with soft vignette',
    prompt: 'Place product on a clean light studio gray background (#F4F4F6) with a subtle radial spotlight gradient behind the product.',
    category: 'background'
  },

  // Cleanup & Retouching
  {
    id: 'clean-blemishes',
    title: 'Dust & Scratch Removal',
    icon: 'Sparkles',
    description: 'Touch up surface imperfections and smudges',
    prompt: 'Clean up all surface dust particles, scratches, fingerprints, and tiny blemishes from the product body, while keeping the product material textures, brand logo, and text completely crisp and clear.',
    category: 'cleanup'
  },
  {
    id: 'clean-glare',
    title: 'Remove Lens Glare',
    icon: 'Eye',
    description: 'Soften harsh reflections and hotspots',
    prompt: 'Remove harsh lighting glare, hotspot reflections, and unwanted camera reflections from glass/metallic surfaces while maintaining natural satin highlights.',
    category: 'cleanup'
  },
  {
    id: 'clean-lighting',
    title: 'Studio Lighting Polish',
    icon: 'Zap',
    description: 'Balance exposure and contrast evenly',
    prompt: 'Enhance and balance product lighting as if shot in a professional photo studio with softboxes. Eliminate dark harsh shadows on the product while boosting color saturation and pop.',
    category: 'cleanup'
  },

  // E-Commerce Marketplace Specs
  {
    id: 'ecom-amazon',
    title: 'Amazon E-Commerce Spec',
    icon: 'ShoppingBag',
    description: 'Pure white, centered product with 85% frame fill',
    prompt: 'Format photo strictly to Amazon Product Image Guidelines: Pure white background (#FFFFFF), product accurately centered occupying 85% of image area, clean edges with realistic subtle drop shadow.',
    category: 'ecommerce'
  },
  {
    id: 'ecom-shopify',
    title: 'Shopify Minimalist Hero',
    icon: 'Store',
    description: 'High-end storefront presentation',
    prompt: 'Create a high-end Shopify hero product photo: seamless off-white background (#F8F9FA), centered product with subtle grounding shadow, balanced contrast and commercial color pop.',
    category: 'ecommerce'
  },
  {
    id: 'ecom-social',
    title: 'Instagram Product Spotlight',
    icon: 'Instagram',
    description: 'Vibrant studio lighting with aesthetic background tone',
    prompt: 'Style photo for Instagram feed: place product on a warm beige pastel background with gentle directional sunlight and botanical shadow pattern in backdrop.',
    category: 'ecommerce'
  },

  // Aesthetic Environments
  {
    id: 'aest-podium',
    title: 'Dark Luxury Podium',
    icon: 'Shield',
    description: 'Premium dark charcoal presentation',
    prompt: 'Place product on a dark charcoal geometric podium with dramatic rim lighting and subtle atmospheric fog, creating a luxury premium feel.',
    category: 'aesthetic'
  },
  {
    id: 'aest-botanical',
    title: 'Botanical Nature Setting',
    icon: 'Feather',
    description: 'Organic leaf shadows and stone base',
    prompt: 'Place product on a smooth natural river stone with soft palm leaf shadows casting softly across a warm stone background.',
    category: 'aesthetic'
  }
];
