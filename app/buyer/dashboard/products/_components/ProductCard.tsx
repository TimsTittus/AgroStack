import Image from "next/image";

type Product = {
    id: string;
    name: string;
    price: string;
    image: string;
    category?: string; 
};

export default function ProductCard({ product }: { product: Product }) {
    return (
        <div className="group relative w-[17vw] max-w-[40vw] overflow-hidden rounded-[24px] bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
            <div className="relative h-64 w-full overflow-hidden rounded-/[20px] bg-gray-100">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 384px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1b4332] backdrop-blur-md">
                    New Arrival
                </div>
            </div>

            <div className="px-2 py-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-widest text-[#2d6a4f]/60">
                        {product.category || "Lifestyle"}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-[#1a2e1a]">
                        {product.name}
                    </h3>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-gray-400 uppercase">Price</span>
                        <span className="text-2xl font-bold text-[#1b4332]">
                            ₹{product.price}
                        </span>
                    </div>

                    <button className="group/btn relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#2d6a4f] text-white transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:w-32 active:scale-95">

                        <div className="absolute transition-all duration-300 group-hover/btn:translate-x-10 group-hover/btn:opacity-0">
                            <PlusIcon />
                        </div>
                        <span className="absolute -translate-x-10 text-sm font-bold opacity-0 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100">
                            Buy Now
                        </span>

                    </button>
                </div>
            </div>
        </div>
    );
}
function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}