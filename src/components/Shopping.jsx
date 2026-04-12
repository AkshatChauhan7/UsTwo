import React from 'react';

const products = [
  {
    id: 1,
    name: 'Couple Hoodies',
    price: '$59.00',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    description: 'Soft matching hoodies for cozy nights and cute coffee runs together.'
  },
  {
    id: 2,
    name: 'Matching Rings',
    price: '$79.00',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80',
    description: 'Minimal rings engraved to celebrate your forever promise.'
  },
  {
    id: 3,
    name: 'Love Photo Frame',
    price: '$24.00',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    description: 'A warm wooden frame for your favorite shared memory.'
  },
  {
    id: 4,
    name: 'Custom Spotify Plaque',
    price: '$34.00',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    description: 'Display your song with a scannable code and romantic glow.'
  },
  {
    id: 5,
    name: 'Couple Mug Set',
    price: '$29.00',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    description: 'Morning coffee tastes better when your mugs match.'
  },
  {
    id: 6,
    name: 'LED Love Lamp',
    price: '$39.00',
    image: 'https://images.unsplash.com/photo-1517994112540-009c47ea476b?auto=format&fit=crop&w=900&q=80',
    description: 'Set the vibe with a soft LED heart lamp for date nights.'
  },
  {
    id: 7,
    name: 'Memory Scrapbook',
    price: '$27.00',
    image: 'https://images.unsplash.com/photo-1452457807411-4979b707c5be?auto=format&fit=crop&w=900&q=80',
    description: 'Collect photos, ticket stubs, and little notes from your story.'
  },
  {
    id: 8,
    name: 'Date Night Box',
    price: '$49.00',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
    description: 'A surprise box with games and prompts for meaningful evenings.'
  },
  {
    id: 9,
    name: 'Couple Bracelet',
    price: '$32.00',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
    description: 'Simple matching bracelets to carry each other everywhere.'
  },
  {
    id: 10,
    name: 'Personalized Cushion',
    price: '$36.00',
    image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=900&q=80',
    description: 'Custom printed cushion with your names and special date.'
  }
];

const Shopping = ({ mood = 'cozy' }) => {
  const isNight = mood === 'night';

  return (
    <div
      className={`h-full min-h-0 rounded-2xl border overflow-y-auto p-4 sm:p-5 ${
        isNight
          ? 'bg-[#1f172a] border-[#3a2d4c]'
          : 'bg-linear-to-br from-rose-50/90 via-pink-50/90 to-purple-50/90 border-pink-100'
      }`}
    >
      <div className="mb-4 sm:mb-5">
        <h2 className={`text-xl sm:text-2xl font-bold ${isNight ? 'text-white' : 'text-gray-800'}`}>
          Shopping for Us 💝
        </h2>
        <p className={`text-sm mt-1 ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>
          Cute picks for your shared moments together.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pb-2">
        {products.map((product) => (
          <article
            key={product.id}
            className={`rounded-2xl overflow-hidden border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
              isNight
                ? 'bg-white/8 border-white/15'
                : 'bg-white/85 border-pink-100'
            }`}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-44 object-cover"
              loading="lazy"
            />

            <div className="p-4">
              <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-white' : 'text-gray-800'}`}>
                {product.name}
              </h3>
              <p className={`text-sm mb-3 min-h-11 ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>
                {product.description}
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-semibold ${isNight ? 'text-pink-200' : 'text-pink-600'}`}>
                  {product.price}
                </span>
                <button
                  type="button"
                  className="ustwo-brand-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
                >
                  View
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Shopping;
